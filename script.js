// =====================================================
// متغيرات اللعبة الرئيسية
// =====================================================

let players = [];
let matchHistory = [];

let nightVictim = null;
let nightProtected = null;

let nightPoisonTarget = null;
let nightPotionUsed = false;
let isGroupPotionActive = false;
let witchBlockedAbility = null;

let currentRoleTurnIndex = 0;
let hasPlayerActed = false;

// إشعار تأكيد الفعل الليلي
let nightConfirmationToast = null;

let votes = {};
let voteTimer = null;
let voteTimeRemaining = 30;
let currentVoterIndex = 0;

let isGameActive = false;


// =====================================================
// عناصر DOM
// =====================================================

const screens =
    document.querySelectorAll('.screen');

const navItems =
    document.querySelectorAll('.nav-item');

const playerNameInput =
    document.getElementById('player-name-input');

const addPlayerBtn =
    document.getElementById('add-player-btn');

const fullPlayersList =
    document.getElementById('full-players-list');

const playerCountDisplay =
    document.getElementById('player-count');

const startGameBtn =
    document.getElementById('start-game-btn');

const roleToggleBtns =
    document.querySelectorAll('.role-toggle-btn');

const roleBox =
    document.getElementById('role-box');

const currentTurnPlayer =
    document.getElementById('current-turn-player');

const currentTurnAvatarContainer =
    document.getElementById(
        'current-turn-avatar-container'
    );

const nextTurnBtn =
    document.getElementById('next-turn-btn');

const currentVoterAvatarContainer =
    document.getElementById(
        'current-voter-avatar-container'
    );


// =====================================================
// الإشعارات داخل اللعبة
// =====================================================

function showGameToast(
    message,
    type = 'warning',
    duration = 3200
) {

    const container =
        document.getElementById(
            'game-toast-container'
        );

    if (!container) {
        console.warn(message);
        return null;
    }

    const toast =
        document.createElement('div');

    toast.className =
        `game-toast game-toast-${type}`;

    const icons = {
        warning: '⚠️',
        danger: '⛔',
        success: '✓',
        info: 'ℹ️'
    };

    const icon =
        icons[type] || icons.warning;

    toast.innerHTML = `
        <span class="game-toast-icon">
            ${icon}
        </span>

        <span>
            ${escapeHtml(String(message))}
        </span>
    `;

    container.appendChild(toast);

    requestAnimationFrame(() => {
        toast.classList.add('show');
    });

    /*
     * إذا كانت المدة 0:
     * يبقى الإشعار ظاهراً حتى يتم حذفه يدوياً.
     */
    if (duration > 0) {

        setTimeout(() => {

            toast.classList.remove('show');

            setTimeout(() => {

                if (toast.parentNode) {
                    toast.remove();
                }

            }, 260);

        }, duration);
    }

    return toast;
}


// =====================================================
// حماية النصوص
// =====================================================

function escapeHtml(text) {

    return String(text)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}


// =====================================================
// حماية أسماء اللاعبين داخل onclick
// =====================================================

function escapeHtmlAttribute(text) {

    return String(text)
        .replace(/\\/g, '\\\\')
        .replace(/'/g, "\\'")
        .replace(/"/g, '&quot;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
}


// =====================================================
// التنقل بين الشاشات
// =====================================================

function switchScreen(screenId) {

    screens.forEach(screen => {
        screen.classList.remove('active');
    });

    const targetScreen =
        document.getElementById(screenId);

    if (!targetScreen) {

        console.error(
            'Screen not found:',
            screenId
        );

        return;
    }

    targetScreen.classList.add('active');

    const gameScreens = [
        'night-screen',
        'morning-screen',
        'vote-screen'
    ];

    if (gameScreens.includes(screenId)) {

        document.body.classList.add(
            'game-in-progress'
        );

    } else {

        document.body.classList.remove(
            'game-in-progress'
        );
    }

    const bottomNav =
        document.getElementById(
            'main-bottom-nav'
        );

    if (bottomNav) {

        if (
            gameScreens.includes(screenId)
        ) {

            bottomNav.style.display =
                'none';

        } else {

            bottomNav.style.display =
                '';
        }
    }
}


// =====================================================
// القائمة السفلية
// =====================================================

navItems.forEach(item => {

    item.addEventListener(
        'click',
        () => {

            if (isGameActive) {

                showGameToast(
                    'لا يمكنك فتح الأقسام الأخرى أثناء المباراة.',
                    'warning'
                );

                return;
            }

            const targetId =
                item.getAttribute(
                    'data-target'
                );

            switchScreen(targetId);

            navItems.forEach(nav => {
                nav.classList.remove(
                    'active'
                );
            });

            item.classList.add('active');
        }
    );

});


// =====================================================
// تفعيل الأدوار
// =====================================================

roleToggleBtns.forEach(btn => {

    btn.addEventListener(
        'click',
        () => {

            btn.classList.toggle('active');

            checkGameStartConditions();
        }
    );

});


// =====================================================
// اللاعبين
// =====================================================

addPlayerBtn.addEventListener(
    'click',
    addPlayer
);


playerNameInput.addEventListener(
    'keypress',
    event => {

        if (event.key === 'Enter') {
            addPlayer();
        }
    }
);


function addPlayer() {

    const name =
        playerNameInput.value.trim();

    if (!name) {

        showGameToast(
            'اكتب اسم اللاعب أولاً.',
            'warning'
        );

        return;
    }

    const newPlayer = {

        id:
            Date.now() +
            Math.random(),

        name: name,

        role: null,

        avatar: null,

        isAlive: true,

        witchState: null
    };

    players.push(newPlayer);

    playerNameInput.value = '';

    renderPlayersList();

    checkGameStartConditions();
}


function deletePlayer(id) {

    if (isGameActive) {
        return;
    }

    players =
        players.filter(
            player =>
                player.id !== id
        );

    renderPlayersList();

    checkGameStartConditions();
}


function updatePlayerAvatar(
    event,
    playerId
) {

    const file =
        event.target.files[0];

    if (!file) {
        return;
    }

    const reader =
        new FileReader();

    reader.onload = function(e) {

        const player =
            players.find(
                p =>
                    p.id === playerId
            );

        if (player) {

            player.avatar =
                e.target.result;

            renderPlayersList();
        }
    };

    reader.readAsDataURL(file);
}


function renderPlayersList() {

    fullPlayersList.innerHTML = '';

    if (players.length === 0) {

        fullPlayersList.innerHTML = `
            <p class="empty-message">
                لم تتم إضافة أي لاعب بعد.
            </p>
        `;

        playerCountDisplay.textContent =
            '0';

        return;
    }

    players.forEach(player => {

        const item =
            document.createElement('div');

        item.className =
            'player-row-item';

        item.innerHTML = `

            <div style="
                display:flex;
                align-items:center;
                gap:10px;
                min-width:0;
                flex:1;
            ">

                <label
                    class="player-avatar-container"
                    title="اضغط لتغيير الصورة">

                    <input
                        type="file"
                        accept="image/*"
                        style="display:none;"
                        onchange="updatePlayerAvatar(event, ${player.id})">

                    ${
                        player.avatar
                            ? `
                                <img
                                    src="${player.avatar}"
                                    class="player-avatar-img"
                                    alt="">
                              `
                            : `
                                <span class="player-avatar-placeholder">
                                    👤
                                </span>
                              `
                    }

                </label>

                <span style="
                    font-weight:bold;
                    font-size:0.84rem;
                    overflow:hidden;
                    text-overflow:ellipsis;
                    white-space:nowrap;
                ">
                    ${escapeHtml(player.name)}
                </span>

            </div>

            <button
                type="button"
                class="player-row-delete"
                onclick="deletePlayer(${player.id})">
                🗑️ حذف
            </button>
        `;

        fullPlayersList.appendChild(item);
    });

    playerCountDisplay.textContent =
        players.length;
}


function checkGameStartConditions() {

    if (players.length >= 3) {

        startGameBtn.disabled = false;

    } else {

        startGameBtn.disabled = true;
    }
}


// =====================================================
// حالة السحرة
// =====================================================

function createWitchState() {

    return {

        potionUsed: false,

        blockedAbility: null,

        blockedNights: 0,

        currentAction: null,

        poisonTarget: null,

        groupPotionActive: false
    };
}


function resetWitchStatesForNewGame() {

    players.forEach(player => {

        if (player.role === 'witch') {

            player.witchState =
                createWitchState();

        } else {

            player.witchState = null;
        }

    });

    nightPoisonTarget = null;

    nightPotionUsed = false;

    isGroupPotionActive = false;

    witchBlockedAbility = null;
}


// =====================================================
// بدء اللعبة
// =====================================================

startGameBtn.addEventListener(
    'click',
    () => {

        if (players.length < 3) {

            showGameToast(
                'لا يمكن بدء المباراة. أضف 3 لاعبين على الأقل.',
                'warning'
            );

            return;
        }

        const rolesAssigned =
            assignRoles();

        if (!rolesAssigned) {

            isGameActive = false;

            document.body.classList.remove(
                'game-in-progress'
            );

            return;
        }

        const werewolves =
            players.filter(
                player =>
                    player.role === 'werewolf'
            );

        if (werewolves.length === 0) {

            isGameActive = false;

            showGameToast(
                'لا يمكن بدء المباراة بدون مستذئب.',
                'danger'
            );

            return;
        }

        isGameActive = true;

        document.body.classList.add(
            'game-in-progress'
        );

        resetWitchStatesForNewGame();

        startNightPhase();
    }
);


// =====================================================
// توزيع الأدوار
// =====================================================

function assignRoles() {

    const playerCount =
        players.length;

    if (playerCount < 3) {

        showGameToast(
            'يجب إضافة 3 لاعبين على الأقل.',
            'warning'
        );

        return false;
    }


    // -----------------------------------------------
    // عدد المستذئبين
    // -----------------------------------------------

    let werewolfCount = 1;

    if (
        playerCount >= 6 &&
        playerCount <= 10
    ) {

        werewolfCount = 2;

    } else if (
        playerCount > 10
    ) {

        werewolfCount =
            3 +
            Math.floor(
                (playerCount - 11) / 5
            );
    }


    // -----------------------------------------------
    // الأدوار المختارة
    // -----------------------------------------------

    let selectedRoles = [];

    roleToggleBtns.forEach(btn => {

        if (
            btn.classList.contains('active')
        ) {

            const role =
                btn.getAttribute('data-role');

            if (role) {
                selectedRoles.push(role);
            }
        }
    });


    // -----------------------------------------------
    // ضمان وجود المستذئب
    // -----------------------------------------------

    const hasWerewolfRole =
        selectedRoles.includes('werewolf');


    if (!hasWerewolfRole) {

        showGameToast(
            'يجب تفعيل دور المستذئب لبدء اللعبة.',
            'warning'
        );

        return false;
    }


    // -----------------------------------------------
    // إزالة المستذئب من الأدوار الخاصة
    // لأننا نضيفه بشكل مضمون لاحقاً
    // -----------------------------------------------

    let otherRoles =
        selectedRoles.filter(
            role =>
                role !== 'werewolf'
        );


    // -----------------------------------------------
    // خلط الأدوار الخاصة
    // -----------------------------------------------

    for (
        let i = otherRoles.length - 1;
        i > 0;
        i--
    ) {

        const j =
            Math.floor(
                Math.random() * (i + 1)
            );

        [
            otherRoles[i],
            otherRoles[j]
        ] = [
            otherRoles[j],
            otherRoles[i]
        ];
    }


    // -----------------------------------------------
    // إنشاء قائمة الأدوار
    // -----------------------------------------------

    let activeRoles = [];


    // المستذئب مضمون 100%
    for (
        let i = 0;
        i < werewolfCount;
        i++
    ) {

        activeRoles.push(
            'werewolf'
        );
    }


    // -----------------------------------------------
    // إضافة الأدوار الأخرى عشوائياً
    // -----------------------------------------------

    const remainingSlots =
        playerCount -
        activeRoles.length;


    for (
        let i = 0;
        i < remainingSlots;
        i++
    ) {

        if (
            i < otherRoles.length
        ) {

            activeRoles.push(
                otherRoles[i]
            );

        } else {

            activeRoles.push(
                'villager'
            );
        }
    }


    // -----------------------------------------------
    // خلط جميع الأدوار
    // -----------------------------------------------

    for (
        let i =
            activeRoles.length - 1;
        i > 0;
        i--
    ) {

        const j =
            Math.floor(
                Math.random() * (i + 1)
            );

        [
            activeRoles[i],
            activeRoles[j]
        ] = [
            activeRoles[j],
            activeRoles[i]
        ];
    }


    // -----------------------------------------------
    // توزيع الأدوار على اللاعبين
    // -----------------------------------------------

    players.forEach(
        (player, index) => {

            player.isAlive = true;

            player.role =
                activeRoles[index];

            player.witchState = null;
        }
    );


    // -----------------------------------------------
    // فحص نهائي مضمون
    // -----------------------------------------------

    const hasWerewolf =
        players.some(
            player =>
                player.role === 'werewolf'
        );


    if (!hasWerewolf) {

        players.forEach(
            player => {
                player.role = null;
            }
        );

        showGameToast(
            'حدث خطأ أثناء توزيع الأدوار. لن تبدأ المباراة.',
            'danger'
        );

        return false;
    }


    return true;
}


// =====================================================
// خروج من اللعبة
// =====================================================

function confirmExitGame() {

    gameConfirm(
        'هل أنت متأكد أنك تريد الخروج؟ سيتم فقدان تقدم المباراة الحالية.',

        () => {

            isGameActive = false;

            clearInterval(voteTimer);

            hasPlayerActed = false;

            if (
                nightConfirmationToast &&
                nightConfirmationToast.parentNode
            ) {

                nightConfirmationToast.classList.remove(
                    'show'
                );

                nightConfirmationToast.remove();
            }

            nightConfirmationToast = null;

            document.body.classList.remove(
                'game-in-progress'
            );

            switchScreen(
                'main-menu-screen'
            );

            const bottomNav =
                document.getElementById(
                    'main-bottom-nav'
                );

            if (bottomNav) {
                bottomNav.style.display = '';
            }

            navItems.forEach(nav => {
                nav.classList.remove(
                    'active'
                );
            });

            const homeNav =
                document.querySelector(
                    '.nav-item[data-target="main-menu-screen"]'
                );

            if (homeNav) {
                homeNav.classList.add('active');
            }
        }
    );
}


function injectHomeButtons() {

    const gameScreens = [
        'night-screen',
        'morning-screen',
        'vote-screen',
        'game-over-screen'
    ];

    gameScreens.forEach(screenId => {

        const screenEl =
            document.getElementById(
                screenId
            );

        if (!screenEl) {
            return;
        }

        const cardEl =
            screenEl.querySelector('.card');

        if (
            !cardEl ||
            cardEl.querySelector('.game-home-btn')
        ) {
            return;
        }

        const homeBtn =
            document.createElement('button');

        homeBtn.type = 'button';

        homeBtn.className =
            'secondary-btn game-home-btn';

        homeBtn.innerHTML =
            '🏠 الرئيسية';

        homeBtn.onclick =
            confirmExitGame;

        cardEl.style.position =
            'relative';

        cardEl.appendChild(homeBtn);
    });
}


// =====================================================
// بداية الليل
// =====================================================

function startNightPhase() {

    injectHomeButtons();

    // تنظيف إشعار التأكيد القديم عند بداية ليلة جديدة
    if (
        nightConfirmationToast &&
        nightConfirmationToast.parentNode
    ) {

        nightConfirmationToast.classList.remove(
            'show'
        );

        nightConfirmationToast.remove();
    }

    nightConfirmationToast = null;

    nightVictim = null;

    nightProtected = null;

    nightPoisonTarget = null;

    nightPotionUsed = false;

    isGroupPotionActive = false;

    witchBlockedAbility = null;

    currentRoleTurnIndex = 0;

    hasPlayerActed = false;


    players.forEach(player => {

        if (
            player.role === 'witch' &&
            player.witchState
        ) {

            /*
             * إذا كان عند الساحر حظر لجولة واحدة:
             * تبقى القدرة محظورة خلال هذه الجولة،
             * ثم ينتهي الحظر للجولة التي بعدها.
             */

            if (
                player.witchState.blockedNights > 0
            ) {

                player.witchState.blockedNights--;

            } else {

                player.witchState.blockedAbility =
                    null;
            }

            player.witchState.currentAction =
                null;

            player.witchState.poisonTarget =
                null;

            player.witchState.groupPotionActive =
                false;
        }
    });


    switchScreen('night-screen');

    setupNextNightTurn();
}


// =====================================================
// تجهيز دور اللاعب
// =====================================================

function setupNextNightTurn() {

    while (
        currentRoleTurnIndex <
            players.length &&
        !players[
            currentRoleTurnIndex
        ].isAlive
    ) {

        currentRoleTurnIndex++;
    }


    if (
        currentRoleTurnIndex >=
        players.length
    ) {

        processNightResults();

        return;
    }


    const player =
        players[currentRoleTurnIndex];


    currentTurnPlayer.textContent =
        player.name;


    hasPlayerActed = false;


    currentTurnAvatarContainer.innerHTML =
        player.avatar

            ? `
                <img
                    src="${player.avatar}"
                    class="in-game-avatar"
                    alt="">
              `

            : `
                <div class="in-game-avatar">
                    👤
                </div>
              `;


    roleBox.className =
        'role-box-hidden';


    roleBox.innerHTML = `

        <div class="role-lock-icon">
            🔒
        </div>

        <p>
            اضغط هنا لكشف دورك وتنفيذ فعلك سراً
        </p>
    `;


    nextTurnBtn.style.display =
        'flex';

    nextTurnBtn.disabled =
        true;

    nextTurnBtn.classList.remove(
        'action-ready'
    );

    nextTurnBtn.classList.add(
        'action-locked'
    );

    nextTurnBtn.textContent =
        'نفّذ فعلك أولاً 🔒';
}


// =====================================================
// كشف الدور
// =====================================================

roleBox.addEventListener(
    'click',
    event => {

        if (
            event.target.closest('button')
        ) {
            return;
        }

        if (
            roleBox.classList.contains(
                'revealed'
            )
        ) {
            return;
        }

        if (
            currentRoleTurnIndex >=
            players.length
        ) {
            return;
        }

        const player =
            players[currentRoleTurnIndex];

        if (!player || !player.isAlive) {
            return;
        }

        roleBox.classList.add(
            'revealed'
        );


        let roleNameAr = '';
        let roleEmoji = '';


        switch (player.role) {

            case 'werewolf':
                roleNameAr = 'مستذئب';
                roleEmoji = '🐺';
                break;

            case 'doctor':
                roleNameAr = 'دكتور';
                roleEmoji = '💉';
                break;

            case 'witch':
                roleNameAr = 'ساحر';
                roleEmoji = '🧙‍♂️';
                break;

            case 'seer':
                roleNameAr = 'عراف';
                roleEmoji = '🔮';
                break;

            default:
                roleNameAr = 'قروي';
                roleEmoji = '🧑';
        }


        let actionHtml = `

            <p style="
                font-size:0.95rem;
                font-weight:bold;
                color:var(--accent-color);
                margin:0 0 10px;
            ">
                دورك هو:
                ${roleEmoji}
                ${roleNameAr}
            </p>
        `;


        // =================================================
        // المستذئب
        // =================================================

        if (
            player.role === 'werewolf'
        ) {

            actionHtml += `

                <p style="
                    font-size:0.82rem;
                    margin:0 0 8px;
                ">
                    اختر ضحية لتقتلها هذه الليلة:
                </p>

                <div style="
                    display:flex;
                    flex-direction:column;
                    gap:6px;
                    max-height:220px;
                    overflow-y:auto;
                ">
            `;


            players.forEach(p => {

                if (
                    p.isAlive &&
                    p.id !== player.id
                ) {

                    const avatarHtml =
                        p.avatar

                            ? `
                                <img
                                    src="${p.avatar}"
                                    class="in-game-avatar"
                                    style="
                                        width:36px;
                                        height:36px;
                                    "
                                    alt="">
                              `

                            : `
                                <span>
                                    👤
                                </span>
                              `;


                    actionHtml += `

                        <button
                            type="button"
                            class="secondary-btn"
                            onclick="setNightAction(
                                'victim',
                                ${p.id},
                                '${escapeHtmlAttribute(p.name)}'
                            )">

                            <span style="
                                display:flex;
                                align-items:center;
                                gap:8px;
                                min-width:0;
                            ">

                                ${avatarHtml}

                                <span style="
                                    overflow:hidden;
                                    text-overflow:ellipsis;
                                    white-space:nowrap;
                                ">
                                    ${escapeHtml(p.name)}
                                </span>

                            </span>

                            <span>
                                اختيار 🎯
                            </span>

                        </button>
                    `;
                }
            });


            actionHtml += `

                </div>

                <p
                    id="selected-victim-text"
                    style="
                        font-size:0.78rem;
                        color:var(--danger-color);
                        margin:7px 0 0;
                        font-weight:bold;
                    ">
                </p>
            `;
        }


        // =================================================
        // الدكتور
        // =================================================

        else if (
            player.role === 'doctor'
        ) {

            actionHtml += `

                <p style="
                    font-size:0.82rem;
                    margin:0 0 8px;
                ">
                    اختر شخصاً لتحميه هذه الليلة:
                </p>

                <div style="
                    display:flex;
                    flex-direction:column;
                    gap:6px;
                    max-height:220px;
                    overflow-y:auto;
                ">
            `;


            players.forEach(p => {

                if (p.isAlive) {

                    const avatarHtml =
                        p.avatar

                            ? `
                                <img
                                    src="${p.avatar}"
                                    class="in-game-avatar"
                                    style="
                                        width:36px;
                                        height:36px;
                                    "
                                    alt="">
                              `

                            : `
                                <span>
                                    👤
                                </span>
                              `;


                    actionHtml += `

                        <button
                            type="button"
                            class="secondary-btn"
                            onclick="setNightAction(
                                'protect',
                                ${p.id},
                                '${escapeHtmlAttribute(p.name)}'
                            )">

                            <span style="
                                display:flex;
                                align-items:center;
                                gap:8px;
                                min-width:0;
                            ">

                                ${avatarHtml}

                                <span style="
                                    overflow:hidden;
                                    text-overflow:ellipsis;
                                    white-space:nowrap;
                                ">
                                    ${escapeHtml(p.name)}
                                </span>

                            </span>

                            <span>
                                حماية 🛡️
                            </span>

                        </button>
                    `;
                }
            });


            actionHtml += `

                </div>

                <p
                    id="selected-protect-text"
                    style="
                        font-size:0.78rem;
                        color:var(--accent-color);
                        margin:7px 0 0;
                        font-weight:bold;
                    ">
                </p>
            `;
        }


        // =================================================
        // الساحر
        // =================================================

        else if (
            player.role === 'witch'
        ) {

            if (!player.witchState) {

                player.witchState =
                    createWitchState();
            }


            const state =
                player.witchState;


            actionHtml += `

                <p style="
                    font-size:0.82rem;
                    margin:0 0 10px;
                ">
                    أنت الساحر 🧙‍♂️،
                    اختر خياراً واحداً فقط لهذه الليلة.
                </p>

                <div style="
                    display:flex;
                    flex-direction:column;
                    gap:7px;
                ">
            `;


            // ---------------------------------------------
            // الإكسير
            // ---------------------------------------------

            if (state.potionUsed) {

                actionHtml += `

                    <p style="
                        font-size:0.75rem;
                        color:var(--text-muted);
                        margin:0;
                    ">
                        🧪 إكسير الحياة مستخدم مسبقاً.
                    </p>
                `;

            } else if (
                state.blockedAbility ===
                'groupPotion'
            ) {

                actionHtml += `

                    <p style="
                        font-size:0.75rem;
                        color:var(--danger-color);
                        margin:0;
                    ">
                        🔒 إكسير الحياة محظور عليك هذه الجولة.
                    </p>
                `;

            } else {

                actionHtml += `

                    <button
                        id="witch-potion-btn"
                        type="button"
                        class="secondary-btn"
                        onclick="setNightAction(
                            'groupPotion',
                            0,
                            'الجميع'
                        )">

                        🧪 إكسير الحياة
                        <span style="
                            font-size:0.7rem;
                            color:var(--text-muted);
                        ">
                            حماية الجميع
                        </span>

                    </button>
                `;
            }


            // ---------------------------------------------
            // السم
            // ---------------------------------------------

            if (
                state.blockedAbility ===
                'poison'
            ) {

                actionHtml += `

                    <p style="
                        font-size:0.75rem;
                        color:var(--danger-color);
                        margin:0;
                    ">
                        🔒 سم الموت محظور عليك هذه الجولة.
                    </p>
                `;

            } else {

                actionHtml += `

                    <button
                        id="witch-poison-toggle-btn"
                        type="button"
                        class="secondary-btn"
                        onclick="toggleWitchPoisonMenu()">

                        ☠️ استخدام سم الموت

                    </button>
                `;
            }


            // ---------------------------------------------
            // التخطي
            // ---------------------------------------------

            actionHtml += `

                    <button
                        id="witch-skip-btn"
                        type="button"
                        class="secondary-btn"
                        onclick="setNightAction(
                            'skip',
                            0,
                            'تخطي'
                        )">

                        ⏭️ تخطي هذه الليلة

                    </button>

                </div>
            `;


            // ---------------------------------------------
            // قائمة السم
            // ---------------------------------------------

            actionHtml += `

                <div
                    id="witch-poison-container"
                    style="
                        display:none;
                        margin-top:9px;
                        padding-top:9px;
                        border-top:
                            1px dashed
                            rgba(255,255,255,0.15);
                    ">

                    <p style="
                        font-size:0.78rem;
                        color:var(--danger-color);
                        font-weight:bold;
                        margin:0 0 7px;
                    ">
                        اختر الشخص المراد تسميمه:
                    </p>

                    <div style="
                        display:flex;
                        flex-direction:column;
                        gap:5px;
                        max-height:170px;
                        overflow-y:auto;
                    ">
            `;


            players.forEach(p => {

                if (
                    p.isAlive &&
                    p.id !== player.id
                ) {

                    const avatarHtml =
                        p.avatar

                            ? `
                                <img
                                    src="${p.avatar}"
                                    class="in-game-avatar"
                                    style="
                                        width:30px;
                                        height:30px;
                                    "
                                    alt="">
                              `

                            : `
                                <span>
                                    👤
                                </span>
                              `;


                    actionHtml += `

                        <button
                            type="button"
                            class="secondary-btn"
                            style="
                                min-height:44px;
                                padding:6px 9px;
                            "
                            onclick="setNightAction(
                                'poison',
                                ${p.id},
                                '${escapeHtmlAttribute(p.name)}'
                            )">

                            <span style="
                                display:flex;
                                align-items:center;
                                gap:7px;
                            ">

                                ${avatarHtml}

                                ${escapeHtml(p.name)}

                            </span>

                            <span style="
                                color:var(--danger-color);
                            ">
                                تسميم ☠️
                            </span>

                        </button>
                    `;
                }
            });


            actionHtml += `

                    </div>

                </div>

                <p
                    id="selected-witch-text"
                    style="
                        font-size:0.78rem;
                        color:var(--accent-color);
                        margin:7px 0 0;
                        font-weight:bold;
                    ">
                </p>
            `;
        }


        // =================================================
        // العراف
        // =================================================

        else if (
            player.role === 'seer'
        ) {

            actionHtml += `

                <p style="
                    font-size:0.82rem;
                    margin:0 0 8px;
                ">
                    أنت العراف 🔮،
                    اختر لاعباً واحداً لكشف دوره:
                </p>

                <div
                    id="seer-targets-container"
                    style="
                        display:flex;
                        flex-direction:column;
                        gap:6px;
                        max-height:220px;
                        overflow-y:auto;
                    ">
            `;


            players.forEach(p => {

                if (
                    p.isAlive &&
                    p.id !== player.id
                ) {

                    const avatarHtml =
                        p.avatar

                            ? `
                                <img
                                    src="${p.avatar}"
                                    class="in-game-avatar"
                                    style="
                                        width:36px;
                                        height:36px;
                                    "
                                    alt="">
                              `

                            : `
                                <span>
                                    👤
                                </span>
                              `;


                    actionHtml += `

                        <button
                            type="button"
                            class="secondary-btn"
                            onclick="setNightAction(
                                'seer',
                                ${p.id},
                                '${escapeHtmlAttribute(p.name)}',
                                '${p.role}'
                            )">

                            <span style="
                                display:flex;
                                align-items:center;
                                gap:8px;
                            ">

                                ${avatarHtml}

                                ${escapeHtml(p.name)}

                            </span>

                            <span>
                                كشف 👁️
                            </span>

                        </button>
                    `;
                }
            });


            actionHtml += `

                </div>

                <p
                    id="selected-seer-text"
                    style="
                        font-size:0.78rem;
                        color:#f39c12;
                        margin:8px 0 0;
                        font-weight:bold;
                        line-height:1.6;
                    ">
                </p>
            `;
        }


        // =================================================
        // القروي
        // =================================================

        else {

            actionHtml += `

                <p style="
                    font-size:0.82rem;
                    color:var(--text-muted);
                    line-height:1.7;
                    margin:0 0 12px;
                ">
                    أنت قروي ولا تملك فعلاً ليلياً.
                </p>

                <button
                    type="button"
                    class="secondary-btn"
                    onclick="setNightAction(
                        'skip',
                        0,
                        'تخطي'
                    )">

                    ⏭️ تأكيد التخطي والمتابعة

                </button>
            `;
        }


        roleBox.innerHTML =
            actionHtml;


        // التالي يبقى مقفلاً
        nextTurnBtn.disabled =
            true;

        nextTurnBtn.classList.remove(
            'action-ready'
        );

        nextTurnBtn.classList.add(
            'action-locked'
        );

        nextTurnBtn.textContent =
            'نفّذ فعلك أولاً 🔒';
    }
);


// =====================================================
// فتح قائمة السم
// =====================================================

function toggleWitchPoisonMenu() {

    if (hasPlayerActed) {
        return;
    }

    const poisonMenu =
        document.getElementById(
            'witch-poison-container'
        );

    if (!poisonMenu) {
        return;
    }

    poisonMenu.style.display =
        poisonMenu.style.display === 'none'
            ? 'block'
            : 'none';
}


// =====================================================
// تنفيذ الفعل الليلي
// =====================================================

function setNightAction(
    type,
    targetId,
    targetName,
    targetRole = ''
) {

    const currentPlayer =
        players[currentRoleTurnIndex];


    if (
        !currentPlayer ||
        !currentPlayer.isAlive
    ) {
        return;
    }


    // =================================================
    // المستذئب
    // =================================================

    if (type === 'victim') {

        const target =
            players.find(
                p =>
                    p.id === targetId
            );


        if (
            !target ||
            !target.isAlive ||
            target.id === currentPlayer.id
        ) {

            showGameToast(
                'لا يمكنك اختيار هذا اللاعب.',
                'warning'
            );

            return;
        }


        nightVictim =
            targetId;


        const textEl =
            document.getElementById(
                'selected-victim-text'
            );


        if (textEl) {

            textEl.textContent =
                `🎯 تم اختيار: ${targetName}`;
        }


        markNightActionCompleted();

        return;
    }


    // =================================================
    // الدكتور
    // =================================================

    if (type === 'protect') {

        const target =
            players.find(
                p =>
                    p.id === targetId
            );


        if (
            !target ||
            !target.isAlive
        ) {

            showGameToast(
                'لا يمكن حماية هذا اللاعب.',
                'warning'
            );

            return;
        }


        nightProtected =
            targetId;


        const textEl =
            document.getElementById(
                'selected-protect-text'
            );


        if (textEl) {

            textEl.textContent =
                `🛡️ تم اختيار حماية: ${targetName}`;
        }


        markNightActionCompleted();

        return;
    }


    // =================================================
    // إكسير الساحر
    // =================================================

    if (type === 'groupPotion') {

        if (
            currentPlayer.role !== 'witch' ||
            !currentPlayer.witchState
        ) {
            return;
        }


        const state =
            currentPlayer.witchState;


        if (state.potionUsed) {

            showGameToast(
                'هذا الساحر استخدم إكسير الحياة مسبقاً.',
                'warning'
            );

            return;
        }


        if (
            state.blockedAbility ===
            'groupPotion'
        ) {

            showGameToast(
                'إكسير الحياة محظور عليك هذه الجولة.',
                'warning'
            );

            return;
        }


        state.currentAction =
            'groupPotion';

        state.potionUsed =
            true;

        state.groupPotionActive =
            true;

        state.blockedAbility =
            'groupPotion';

        /*
         * حظر للجولة القادمة فقط.
         */
        state.blockedNights =
            1;


        isGroupPotionActive =
            true;

        nightPotionUsed =
            true;


        markNightActionCompleted();


        lockWitchOptionsAfterChoice(
            '🧪 تم تفعيل إكسير الحياة لحماية الجميع!'
        );

        return;
    }


    // =================================================
    // سم الساحر
    // =================================================

    if (type === 'poison') {

        if (
            currentPlayer.role !== 'witch' ||
            !currentPlayer.witchState
        ) {
            return;
        }


        const state =
            currentPlayer.witchState;


        if (
            state.blockedAbility ===
            'poison'
        ) {

            showGameToast(
                'سم الموت محظور عليك هذه الجولة.',
                'warning'
            );

            return;
        }


        const target =
            players.find(
                p =>
                    p.id === targetId
            );


        if (
            !target ||
            !target.isAlive ||
            target.id === currentPlayer.id
        ) {

            showGameToast(
                'لا يمكن تسميم هذا اللاعب.',
                'warning'
            );

            return;
        }


        state.currentAction =
            'poison';

        state.poisonTarget =
            targetId;

        state.groupPotionActive =
            false;

        state.blockedAbility =
            'poison';

        /*
         * حظر السم للجولة القادمة
         * لهذا الساحر فقط.
         */
        state.blockedNights =
            1;


        nightPoisonTarget =
            targetId;


        const poisonMenu =
            document.getElementById(
                'witch-poison-container'
            );


        if (poisonMenu) {
            poisonMenu.style.display =
                'none';
        }


        markNightActionCompleted();


        lockWitchOptionsAfterChoice(
            `☠️ تم اختيار تسميم اللاعب ${targetName} بنجاح!`
        );

        return;
    }


    // =================================================
    // التخطي
    // =================================================

    if (type === 'skip') {

        if (
            currentPlayer.role === 'witch' &&
            currentPlayer.witchState
        ) {

            currentPlayer.witchState.currentAction =
                'skip';

            currentPlayer.witchState.poisonTarget =
                null;

            currentPlayer.witchState.groupPotionActive =
                false;
        }


        markNightActionCompleted();


        if (
            currentPlayer.role === 'witch'
        ) {

            lockWitchOptionsAfterChoice(
                '⏭️ تم اختيار التخطي لهذه الليلة.'
            );
        }

        return;
    }


    // =================================================
    // العراف
    // =================================================

    if (type === 'seer') {

        const target =
            players.find(
                p =>
                    p.id === targetId
            );


        if (
            !target ||
            !target.isAlive ||
            target.id === currentPlayer.id
        ) {

            showGameToast(
                'لا يمكن كشف هذا اللاعب.',
                'warning'
            );

            return;
        }


        let roleNameAr = '';
        let roleEmoji = '';


        switch (targetRole) {

            case 'werewolf':
                roleNameAr = 'مستذئب';
                roleEmoji = '🐺';
                break;

            case 'doctor':
                roleNameAr = 'دكتور';
                roleEmoji = '💉';
                break;

            case 'witch':
                roleNameAr = 'ساحر';
                roleEmoji = '🧙‍♂️';
                break;

            case 'seer':
                roleNameAr = 'عراف';
                roleEmoji = '🔮';
                break;

            default:
                roleNameAr = 'قروي';
                roleEmoji = '🧑';
        }


        const targetsContainer =
            document.getElementById(
                'seer-targets-container'
            );


        if (targetsContainer) {

            targetsContainer.style.display =
                'none';
        }


        const textEl =
            document.getElementById(
                'selected-seer-text'
            );


        if (textEl) {

            textEl.textContent =
                `✨ اللاعب ${targetName} دوره هو (${roleEmoji} ${roleNameAr})`;
        }


        markNightActionCompleted();

        return;
    }
}


// =====================================================
// تسجيل اكتمال الفعل
// =====================================================

function markNightActionCompleted() {

    hasPlayerActed =
        true;


    nextTurnBtn.disabled =
        false;


    nextTurnBtn.classList.remove(
        'action-locked'
    );


    nextTurnBtn.classList.add(
        'action-ready'
    );


    nextTurnBtn.textContent =
        'التالي ➜';


    // حذف إشعار تأكيد قديم إن وجد
    if (
        nightConfirmationToast &&
        nightConfirmationToast.parentNode
    ) {

        nightConfirmationToast.classList.remove(
            'show'
        );

        nightConfirmationToast.remove();
    }


    // إشعار ثابت حتى الضغط على "التالي"
    nightConfirmationToast =
        showGameToast(
            'تم التأكيد',
            'success',
            0
        );
}


// =====================================================
// قفل خيارات الساحر
// =====================================================

function lockWitchOptionsAfterChoice(
    successMessage
) {

    const buttons = [
        document.getElementById(
            'witch-potion-btn'
        ),
        document.getElementById(
            'witch-poison-toggle-btn'
        ),
        document.getElementById(
            'witch-skip-btn'
        )
    ];


    buttons.forEach(button => {

        if (!button) {
            return;
        }

        button.disabled =
            true;

        button.style.opacity =
            '0.45';
    });


    const poisonContainer =
        document.getElementById(
            'witch-poison-container'
        );


    if (poisonContainer) {

        poisonContainer.style.display =
            'none';
    }


    const textEl =
        document.getElementById(
            'selected-witch-text'
        );


    if (textEl) {

        textEl.textContent =
            successMessage;
    }
}


// =====================================================
// زر التالي
// =====================================================

nextTurnBtn.addEventListener(
    'click',
    () => {

        const player =
            players[currentRoleTurnIndex];


        if (!player) {
            return;
        }


        /*
         * أهم حماية:
         * لا يمكن الانتقال نهائياً
         * بدون تنفيذ الفعل.
         */
        if (!hasPlayerActed) {

            showGameToast(
                '🔒 يجب تنفيذ فعلك أولاً قبل الانتقال.',
                'warning',
                3000
            );

            nextTurnBtn.disabled =
                true;

            nextTurnBtn.textContent =
                'نفّذ فعلك أولاً 🔒';

            return;
        }


        // إزالة إشعار "تم التأكيد" عند الضغط على التالي
        if (
            nightConfirmationToast &&
            nightConfirmationToast.parentNode
        ) {

            nightConfirmationToast.classList.remove(
                'show'
            );

            nightConfirmationToast.remove();
        }

        nightConfirmationToast = null;


        nextTurnBtn.disabled =
            true;


        currentRoleTurnIndex++;


        setupNextNightTurn();
    }
);


// =====================================================
// جمع أفعال جميع السحرة
// =====================================================

function getAllWitchActions() {

    return players

        .filter(
            player =>
                player.isAlive &&
                player.role === 'witch' &&
                player.witchState
        )

        .map(player => ({

            playerId:
                player.id,

            playerName:
                player.name,

            action:
                player.witchState.currentAction,

            poisonTarget:
                player.witchState.poisonTarget,

            groupPotionActive:
                player.witchState.groupPotionActive === true
        }));
}


// =====================================================
// معالجة نتائج الليل
// =====================================================

function processNightResults() {

    const witchActions =
        getAllWitchActions();


    // -----------------------------------------------
    // الإكسير
    // -----------------------------------------------

    const potionUsedTonight =
        witchActions.some(
            action =>
                action.action ===
                    'groupPotion' &&
                action.groupPotionActive === true
        );


    isGroupPotionActive =
        potionUsedTonight;


    // -----------------------------------------------
    // السم
    // -----------------------------------------------

    const poisonTargets =
        witchActions

            .filter(
                action =>
                    action.action === 'poison' &&
                    action.poisonTarget !== null
            )

            .map(
                action =>
                    action.poisonTarget
            );


    const uniquePoisonTargets =
        [...new Set(poisonTargets)];


    // -----------------------------------------------
    // الصباح
    // -----------------------------------------------

    switchScreen(
        'morning-screen'
    );

    injectHomeButtons();


    const morningResultText =
        document.getElementById(
            'morning-result-text'
        );


    let summaryMessages = [];


    // -----------------------------------------------
    // حماية الإكسير
    // -----------------------------------------------

    if (isGroupPotionActive) {

        summaryMessages.push(
            'استخدم الساحر إكسير الحياة لحماية القرية بأكملها من هجمات المستذئبين! 🧪🛡️'
        );

    } else if (
        nightVictim !== null
    ) {

        if (
            nightVictim ===
            nightProtected
        ) {

            summaryMessages.push(
                'هاجم المستذئبون أحداً، لكن الدكتور تصدى للهجوم وأنقذه! 💉🛡️'
            );

        } else {

            const victim =
                players.find(
                    p =>
                        p.id ===
                        nightVictim
                );


            if (
                victim &&
                victim.isAlive
            ) {

                victim.isAlive =
                    false;

                summaryMessages.push(
                    `عُثر على اللاعب <b style="color:var(--danger-color);">${escapeHtml(victim.name)}</b> مقتولاً بواسطة المستذئبين! ⚰️`
                );
            }
        }
    }


    // -----------------------------------------------
    // السم
    // -----------------------------------------------

    uniquePoisonTargets.forEach(
        poisonTargetId => {

            const poisoned =
                players.find(
                    p =>
                        p.id ===
                        poisonTargetId
                );


            if (
                poisoned &&
                poisoned.isAlive
            ) {

                poisoned.isAlive =
                    false;

                summaryMessages.push(
                    `أطلق الساحر سمّه المميت وتسبب في وفاة اللاعب <b style="color:var(--danger-color);">${escapeHtml(poisoned.name)}</b>! ☠️`
                );
            }
        }
    );


    // -----------------------------------------------
    // عرض الصباح
    // -----------------------------------------------

    if (
        summaryMessages.length > 0
    ) {

        morningResultText.innerHTML =
            `☀️ شروق الشمس!<br>` +
            summaryMessages.join('<br>');

    } else {

        morningResultText.innerHTML =
            `
                ☀️ شروق الشمس!<br>
                مرت الليلة بسلام تام ولم يحدث أي مكروه.
            `;
    }


    setTimeout(
        () => {

            checkWinConditions();

        },
        300
    );
}


// =====================================================
// الانتقال للتصويت
// =====================================================

document
    .getElementById(
        'go-to-vote-btn'
    )
    .addEventListener(
        'click',
        () => {

            if (!isGameActive) {
                return;
            }

            switchScreen(
                'vote-screen'
            );

            injectHomeButtons();

            startVotingPhase();
        }
    );


// =====================================================
// التصويت
// =====================================================

function startVotingPhase() {

    currentVoterIndex =
        0;

    votes = {};

    setupNextVoter();
}


// =====================================================
// تجهيز المصوت
// =====================================================

function setupNextVoter() {

    while (
        currentVoterIndex <
            players.length &&
        !players[
            currentVoterIndex
        ].isAlive
    ) {

        currentVoterIndex++;
    }


    if (
        currentVoterIndex >=
        players.length
    ) {

        finishVoting();

        return;
    }


    const voter =
        players[currentVoterIndex];


    document
        .getElementById(
            'current-voter-name'
        )
        .textContent =
            voter.name;


    currentVoterAvatarContainer.innerHTML =
        voter.avatar

            ? `
                <img
                    src="${voter.avatar}"
                    class="in-game-avatar"
                    alt="">
              `

            : `
                <div class="in-game-avatar">
                    👤
                </div>
              `;


    const targetsList =
        document.getElementById(
            'vote-targets-list'
        );


    targetsList.innerHTML = '';


    players.forEach(target => {

        if (!target.isAlive) {
            return;
        }

        /*
         * لا يصوّت اللاعب ضد نفسه.
         */
        if (
            target.id === voter.id
        ) {
            return;
        }


        const btn =
            document.createElement(
                'button'
            );


        btn.type = 'button';

        btn.className =
            'secondary-btn';


        const targetAvatarHtml =
            target.avatar

                ? `
                    <img
                        src="${target.avatar}"
                        class="in-game-avatar"
                        style="
                            width:34px;
                            height:34px;
                        "
                        alt="">
                  `

                : `
                    <span>
                        👤
                    </span>
                  `;


        btn.innerHTML = `

            <span style="
                display:flex;
                align-items:center;
                gap:8px;
                min-width:0;
            ">

                ${targetAvatarHtml}

                <span style="
                    overflow:hidden;
                    text-overflow:ellipsis;
                    white-space:nowrap;
                ">
                    ${escapeHtml(target.name)}
                </span>

            </span>

            <span style="
                color:var(--accent-color);
            ">
                تصويت 🎯
            </span>
        `;


        btn.onclick =
            () =>
                castVote(
                    target.id
                );


        targetsList.appendChild(
            btn
        );
    });


    resetVoteTimer();
}


// =====================================================
// مؤقت التصويت
// =====================================================

function resetVoteTimer() {

    clearInterval(voteTimer);


    const voteTimeInput =
        document.getElementById(
            'setting-vote-time'
        );


    voteTimeRemaining =
        voteTimeInput

            ? Math.max(
                5,
                parseInt(
                    voteTimeInput.value
                ) || 30
            )

            : 30;


    const timerDisplay =
        document.getElementById(
            'vote-timer-display'
        );


    timerDisplay.textContent =
        voteTimeRemaining;


    voteTimer =
        setInterval(
            () => {

                voteTimeRemaining--;

                timerDisplay.textContent =
                    voteTimeRemaining;


                if (
                    voteTimeRemaining <= 0
                ) {

                    clearInterval(
                        voteTimer
                    );

                    castVote(null);
                }

            },
            1000
        );
}


// =====================================================
// تخطي التصويت
// =====================================================

document
    .getElementById(
        'skip-single-vote-btn'
    )
    .addEventListener(
        'click',
        () => {

            clearInterval(
                voteTimer
            );

            castVote(null);
        }
    );


// =====================================================
// تسجيل التصويت
// =====================================================

function castVote(targetId) {

    clearInterval(
        voteTimer
    );


    const voter =
        players[currentVoterIndex];


    if (
        targetId !== null &&
        voter &&
        targetId !== voter.id
    ) {

        votes[targetId] =
            (votes[targetId] || 0) + 1;
    }


    currentVoterIndex++;

    setupNextVoter();
}


// =====================================================
// إنهاء التصويت
// =====================================================

function finishVoting() {

    let maxVotes = 0;

    let topCandidates = [];

    let totalVotesCast = 0;


    for (
        let id in votes
    ) {

        totalVotesCast +=
            votes[id];


        if (
            votes[id] >
            maxVotes
        ) {

            maxVotes =
                votes[id];

            topCandidates =
                [id];

        } else if (
            votes[id] ===
                maxVotes &&
            maxVotes > 0
        ) {

            topCandidates.push(
                id
            );
        }
    }


    const alivePlayersCount =
        players.filter(
            p =>
                p.isAlive
        ).length;


    const skipCount =
        Math.max(
            0,
            alivePlayersCount -
            totalVotesCast
        );


    let voteResultSummary = '';


    if (
        maxVotes === 0 ||
        topCandidates.length === 0 ||
        skipCount >= maxVotes
    ) {

        voteResultSummary =
            `
                اختارت الأغلبية
                <b>التخطي</b>
                أو لم تكن هناك أصوات كافية للطرد،
                لذلك لم يتم طرد أي شخص هذه المرة.
            `;

    } else if (
        topCandidates.length > 1
    ) {

        const tiedNames =
            topCandidates

                .map(id => {

                    const p =
                        players.find(
                            x =>
                                x.id == id
                        );

                    return p
                        ? escapeHtml(
                            p.name
                        )
                        : '';

                })

                .filter(Boolean)

                .join(' و ');


        voteResultSummary =
            `
                ⚖️ تعادل في الأصوات بين:
                <b style="color:#f39c12;">
                    ${tiedNames}
                </b>
                !
                نظراً للتعادل، لم يتم طرد أحد.
            `;

    } else {

        const eliminatedPlayerId =
            topCandidates[0];


        const eliminated =
            players.find(
                p =>
                    p.id ==
                    eliminatedPlayerId
            );


        if (eliminated) {

            eliminated.isAlive =
                false;


            const roleText =
                eliminated.role ===
                'werewolf'

                    ? 'مستذئب 🐺'

                    : 'بريء 🧑';


            voteResultSummary =
                `
                    تم طرد اللاعب
                    <b style="color:var(--danger-color);">
                        ${escapeHtml(eliminated.name)}
                    </b>
                    بأغلبية الأصوات! ⚖️

                    <br>

                    دوره كان:
                    (${roleText})
                `;
        }
    }


    if (
        !checkWinConditions()
    ) {

        switchScreen(
            'morning-screen'
        );

        injectHomeButtons();


        document
            .getElementById(
                'morning-result-text'
            )
            .innerHTML =
                `
                    ${voteResultSummary}

                    <br><br>

                    <b>
                        تستمر الحياة في القرية
                        وتستعد الجولة التالية...
                    </b>
                `;


        const goToVoteBtn =
            document.getElementById(
                'go-to-vote-btn'
            );


        goToVoteBtn.textContent =
            'البدء بالجولة الليلية القادمة 🌙';


        goToVoteBtn.onclick =
            () => {

                goToVoteBtn.onclick =
                    () => {

                        switchScreen(
                            'vote-screen'
                        );

                        injectHomeButtons();

                        startVotingPhase();
                    };


                startNightPhase();
            };
    }
}


// =====================================================
// شروط الفوز
// =====================================================

function checkWinConditions() {

    const alivePlayers =
        players.filter(
            p =>
                p.isAlive
        );


    const aliveWerewolves =
        alivePlayers.filter(
            p =>
                p.role ===
                'werewolf'
        );


    const aliveVillagers =
        alivePlayers.filter(
            p =>
                p.role !==
                'werewolf'
        );


    let gameOver =
        false;

    let winText =
        '';


    if (
        aliveWerewolves.length === 0
    ) {

        gameOver =
            true;

        winText =
            '🎉 فاز القرويون الأبرياء! تم القضاء على جميع المستذئبين.';

    } else if (
        aliveWerewolves.length >=
        aliveVillagers.length
    ) {

        gameOver =
            true;

        winText =
            '🐺 فاز المستذئبون! سيطروا على القرية بالكامل.';
    }


    if (gameOver) {

        isGameActive =
            false;

        clearInterval(
            voteTimer
        );

        document.body.classList.remove(
            'game-in-progress'
        );

        switchScreen(
            'game-over-screen'
        );

        injectHomeButtons();


        document
            .getElementById(
                'game-over-text'
            )
            .innerHTML =
                winText;


        saveMatchRecord(
            winText
        );


        return true;
    }


    return false;
}


// =====================================================
// السجل
// =====================================================

function saveMatchRecord(
    resultSummary
) {

    const historyList =
        document.getElementById(
            'history-list'
        );


    if (
        matchHistory.length === 0
    ) {

        historyList.innerHTML =
            '';
    }


    matchHistory.push(
        resultSummary
    );


    const recordItem =
        document.createElement(
            'div'
        );


    recordItem.className =
        'player-row-item';


    recordItem.innerHTML = `

        <span style="
            font-size:0.76rem;
            line-height:1.6;
        ">

            نهاية مباراة
            (${matchHistory.length}):

            ${resultSummary}

        </span>
    `;


    historyList.appendChild(
        recordItem
    );
}


// =====================================================
// إعادة اللعبة
// =====================================================

document
    .getElementById(
        'restart-btn'
    )
    .addEventListener(
        'click',
        () => {

            isGameActive =
                false;

            clearInterval(
                voteTimer
            );

            hasPlayerActed =
                false;

            if (
                nightConfirmationToast &&
                nightConfirmationToast.parentNode
            ) {

                nightConfirmationToast.classList.remove(
                    'show'
                );

                nightConfirmationToast.remove();
            }

            nightConfirmationToast = null;

            document.body.classList.remove(
                'game-in-progress'
            );

            switchScreen(
                'main-menu-screen'
            );


            const bottomNav =
                document.getElementById(
                    'main-bottom-nav'
                );


            if (bottomNav) {
                bottomNav.style.display =
                    '';
            }


            navItems.forEach(
                nav =>
                    nav.classList.remove(
                        'active'
                    )
            );


            const homeNav =
                document.querySelector(
                    '.nav-item[data-target="main-menu-screen"]'
                );


            if (homeNav) {
                homeNav.classList.add(
                    'active'
                );
            }
        }
    );


// =====================================================
// نافذة التأكيد
// =====================================================

function gameConfirm(
    message,
    onConfirm,
    onCancel
) {

    const overlay =
        document.createElement(
            'div'
        );


    overlay.className =
        'game-confirm-overlay';


    overlay.innerHTML = `

        <div class="game-confirm-box">

            <div class="game-confirm-icon">
                ⚠️
            </div>

            <div class="game-confirm-title">
                تأكيد
            </div>

            <div class="game-confirm-message">
                ${escapeHtml(message)}
            </div>

            <div class="game-confirm-actions">

                <button
                    type="button"
                    class="game-confirm-cancel"
                    id="game-confirm-cancel">

                    إلغاء

                </button>

                <button
                    type="button"
                    class="game-confirm-ok"
                    id="game-confirm-ok">

                    تأكيد

                </button>

            </div>

        </div>
    `;


    document.body.appendChild(
        overlay
    );


    requestAnimationFrame(
        () => {

            overlay.classList.add(
                'show'
            );
        }
    );


    const close =
        () => {

            overlay.classList.remove(
                'show'
            );

            setTimeout(
                () => {

                    if (
                        overlay.parentNode
                    ) {

                        overlay.remove();
                    }

                },
                250
            );
        };


    overlay
        .querySelector(
            '#game-confirm-ok'
        )
        .onclick =
            () => {

                close();

                if (
                    typeof onConfirm ===
                    'function'
                ) {

                    onConfirm();
                }
            };


    overlay
        .querySelector(
            '#game-confirm-cancel'
        )
        .onclick =
            () => {

                close();

                if (
                    typeof onCancel ===
                    'function'
                ) {

                    onCancel();
                }
            };
}


// =====================================================
// استبدال alert
// =====================================================

window.alert =
    function(message) {

        showGameToast(
            message,
            'warning'
        );
    };


// =====================================================
// المؤثرات
// =====================================================

document.addEventListener(
    'click',
    event => {

        const button =
            event.target.closest(
                'button'
            );

        if (!button || button.disabled) {
            return;
        }


        const rect =
            button.getBoundingClientRect();


        const ripple =
            document.createElement(
                'span'
            );


        ripple.className =
            'button-ripple';


        const size =
            Math.max(
                rect.width,
                rect.height
            );


        ripple.style.width =
            size + 'px';

        ripple.style.height =
            size + 'px';

        ripple.style.left =
            (
                event.clientX -
                rect.left -
                size / 2
            ) + 'px';

        ripple.style.top =
            (
                event.clientY -
                rect.top -
                size / 2
            ) + 'px';


        button.appendChild(
            ripple
        );


        setTimeout(
            () => {

                if (
                    ripple.parentNode
                ) {

                    ripple.remove();
                }

            },
            500
        );
    },
    {
        passive: true
    }
);


// =====================================================
// منع الضغط المزدوج
// =====================================================

document.addEventListener(
    'click',
    event => {

        const button =
            event.target.closest(
                'button'
            );


        if (!button) {
            return;
        }


        if (
            button.dataset.locked ===
            'true'
        ) {

            event.preventDefault();

            return;
        }


        if (
            button.dataset.noDoubleLock ===
            'true'
        ) {
            return;
        }


        button.dataset.locked =
            'true';


        setTimeout(
            () => {

                button.dataset.locked =
                    'false';

            },
            350
        );

    },
    true
);


// =====================================================
// الاهتزاز
// =====================================================

function gameHaptic(
    pattern = 10
) {

    try {

        if (
            'vibrate' in navigator
        ) {

            navigator.vibrate(
                pattern
            );
        }

    } catch (error) {
        // غير مدعوم
    }
}


document.addEventListener(
    'click',
    event => {

        const button =
            event.target.closest(
                'button'
            );

        if (!button || button.disabled) {
            return;
        }

        gameHaptic(8);
    },
    {
        passive: true
    }
);


// =====================================================
// Viewport
// =====================================================

function updateMobileViewport() {

    document.documentElement.style.setProperty(
        '--real-vh',
        `${window.innerHeight * 0.01}px`
    );
}

updateMobileViewport();

window.addEventListener(
    'resize',
    updateMobileViewport,
    {
        passive: true
    }
);


// =====================================================
// إعدادات الواجهة
// =====================================================

const UI_STORAGE_KEY =
    'werewolf_mobile_ui';


function saveUIPreference(
    key,
    value
) {

    try {

        const current =
            JSON.parse(
                localStorage.getItem(
                    UI_STORAGE_KEY
                ) || '{}'
            );


        current[key] =
            value;


        localStorage.setItem(
            UI_STORAGE_KEY,
            JSON.stringify(current)
        );

    } catch (error) {

        console.warn(
            'تعذر حفظ إعداد الواجهة'
        );
    }
}


function loadUIPreferences() {

    try {

        return JSON.parse(
            localStorage.getItem(
                UI_STORAGE_KEY
            ) || '{}'
        );

    } catch (error) {

        return {};
    }
}


// =====================================================
// الموسيقى
// =====================================================

const musicToggle =
    document.getElementById(
        'setting-music-toggle'
    );

const bgMusic =
    document.getElementById(
        'bg-music'
    );


if (musicToggle) {

    const settings =
        loadUIPreferences();


    if (
        typeof settings.music !==
        'undefined'
    ) {

        musicToggle.checked =
            settings.music;
    }


    musicToggle.addEventListener(
        'change',
        () => {

            saveUIPreference(
                'music',
                musicToggle.checked
            );


            if (
                musicToggle.checked
            ) {

                bgMusic
                    .play()
                    .catch(
                        () => {}
                    );

            } else {

                bgMusic.pause();
            }
        }
    );
}


// =====================================================
// الوضع الليلي
// =====================================================

const darkModeToggle =
    document.getElementById(
        'setting-dark-mode'
    );


if (darkModeToggle) {

    darkModeToggle.checked =
        true;

    darkModeToggle.addEventListener(
        'change',
        () => {

            /*
             * اللعبة مصممة أساساً
             * بالوضع الداكن، لذلك يبقى
             * الوضع متناسقاً مع التصميم.
             */
        }
    );
}


// =====================================================
// إيقاف الموسيقى عند مغادرة التطبيق
// =====================================================

document.addEventListener(
    'visibilitychange',
    () => {

        if (!bgMusic) {
            return;
        }


        if (
            document.hidden
        ) {

            if (
                !bgMusic.paused
            ) {

                bgMusic.dataset.wasPlaying =
                    'true';

                bgMusic.pause();
            }

        } else {

            if (
                bgMusic.dataset.wasPlaying ===
                'true'
            ) {

                bgMusic
                    .play()
                    .catch(
                        () => {}
                    );

                delete bgMusic.dataset
                    .wasPlaying;
            }
        }
    }
);


// =====================================================
// تعطيل قائمة الضغط المطول على الأزرار
// =====================================================

document.addEventListener(
    'contextmenu',
    event => {

        if (
            event.target.closest(
                'button'
            )
        ) {

            event.preventDefault();
        }
    }
);


// =====================================================
// شاشة التحميل
// =====================================================

(function initGameLoading() {

    const loadingScreen =
        document.getElementById(
            'game-loading-screen'
        );

    const progress =
        document.getElementById(
            'loading-progress'
        );

    const percent =
        document.getElementById(
            'loading-percent'
        );

    const status =
        document.getElementById(
            'loading-status-text'
        );


    if (!loadingScreen) {
        return;
    }


    const loadingSteps = [

        {
            progress: 15,
            text: 'جاري تشغيل النظام...'
        },

        {
            progress: 32,
            text: 'جاري تجهيز اللاعبين...'
        },

        {
            progress: 50,
            text: 'جاري تحميل الأدوار...'
        },

        {
            progress: 68,
            text: 'جاري تجهيز الليل والنهار...'
        },

        {
            progress: 84,
            text: 'جاري تجهيز واجهة اللعبة...'
        },

        {
            progress: 100,
            text: 'تم تجهيز اللعبة'
        }
    ];


    let currentStep =
        0;


    function runLoadingStep() {

        if (
            currentStep >=
            loadingSteps.length
        ) {

            setTimeout(
                () => {

                    loadingScreen.classList.add(
                        'hide'
                    );

                },
                350
            );

            return;
        }


        const step =
            loadingSteps[
                currentStep
            ];


        if (progress) {

            progress.style.width =
                step.progress + '%';
        }


        if (percent) {

            percent.textContent =
                step.progress + '%';
        }


        if (status) {

            status.textContent =
                step.text;
        }


        currentStep++;


        setTimeout(
            runLoadingStep,
            180 +
            Math.random() * 220
        );
    }


    setTimeout(
        runLoadingStep,
        150
    );

})();