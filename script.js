let players = [];
let currentTurnIndex = 0;

let werewolfTargets = [];
let doctorTargets = [];
let witchElixirUsed = false;
let witchElixirActiveThisNight = false;
let witchPoisonTargets = [];
let lastDoctorTargets = {}; 

let voteCounts = {};
let skipVotesCount = 0;
let currentVoterIndex = 0;

const setupScreen = document.getElementById('setup-screen');
const nightScreen = document.getElementById('night-screen');
const morningScreen = document.getElementById('morning-screen');
const voteScreen = document.getElementById('vote-screen');
const gameOverScreen = document.getElementById('game-over-screen');

const playerNameInput = document.getElementById('player-name-input');
const addPlayerBtn = document.getElementById('add-player-btn');
const playersGrid = document.getElementById('players-grid');
const playerCountSpan = document.getElementById('player-count');
const startGameBtn = document.getElementById('start-game-btn');

const currentTurnPlayerSpan = document.getElementById('current-turn-player');
const roleBox = document.getElementById('role-box');
const nextTurnBtn = document.getElementById('next-turn-btn');

const morningResultText = document.getElementById('morning-result-text');
const goToVoteBtn = document.getElementById('go-to-vote-btn');

const currentVoterNameSpan = document.getElementById('current-voter-name');
const voteTargetsList = document.getElementById('vote-targets-list');
const skipSingleVoteBtn = document.getElementById('skip-single-vote-btn');

const gameOverText = document.getElementById('game-over-text');
const restartBtn = document.getElementById('restart-btn');

document.querySelectorAll('.role-toggle-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        btn.classList.toggle('active');
    });
});

addPlayerBtn.addEventListener('click', addPlayer);
playerNameInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') addPlayer();
});

function addPlayer() {
    const name = playerNameInput.value.trim();
    if (!name) return;
    if (players.some(p => p.name === name)) {
        alert('هذا الاسم موجود مسبقاً!');
        return;
    }
    if (players.length >= 30) {
        alert('الحد الأقصى هو 30 لاعباً!');
        return;
    }

    players.push({ name: name, role: '', isAlive: true });
    playerNameInput.value = '';
    updatePlayersUI();
}

function removePlayer(index) {
    players.splice(index, 1);
    updatePlayersUI();
}

function updatePlayersUI() {
    playersGrid.innerHTML = '';
    players.forEach((player, index) => {
        const chip = document.createElement('div');
        chip.className = 'player-chip';
        chip.innerHTML = `
            <span class="player-chip-name" title="${player.name}">${player.name}</span>
            <button class="player-chip-delete" onclick="removePlayer(${index})">حذف ✕</button>
        `;
        playersGrid.appendChild(chip);
    });
    playerCountSpan.textContent = players.length;
    
    if (players.length >= 3 && players.length <= 30) {
        startGameBtn.disabled = false;
    } else {
        startGameBtn.disabled = true;
    }
}

// التوزيع العشوائي الكامل للأدوار بناءً على الشخصيات المفعلة
startGameBtn.addEventListener('click', () => {
    if (players.length < 3) {
        alert('يجب إضافة 3 لاعبين على الأقل لبدء اللعبة!');
        return;
    }

    const isWwActive = document.querySelector('.role-toggle-btn[data-role="werewolf"]').classList.contains('active');
    const isDocActive = document.querySelector('.role-toggle-btn[data-role="doctor"]').classList.contains('active');
    const isWitchActive = document.querySelector('.role-toggle-btn[data-role="witch"]').classList.contains('active');
    const isSeerActive = document.querySelector('.role-toggle-btn[data-role="seer"]').classList.contains('active');
    const isVillagerActive = document.querySelector('.role-toggle-btn[data-role="villager"]').classList.contains('active');

    if (!isWwActive) {
        alert('يجب تفعيل المستذئب على الأقل لبدء اللعبة!');
        return;
    }

    // بناء قائمة بالأدوار المتاحة بناءً على الأزرار المفعلة فقط
    let availableRoleTypes = [];
    if (isWwActive) availableRoleTypes.push('مستذئب 🐺');
    if (isDocActive) availableRoleTypes.push('دكتور 💉');
    if (isWitchActive) availableRoleTypes.push('ساحر 🧙‍♂️');
    if (isSeerActive) availableRoleTypes.push('عراف 🔮');
    if (isVillagerActive) availableRoleTypes.push('قروي 🧑');

    if (availableRoleTypes.length === 0) {
        alert('يرجى تفعيل دور واحد على الأقل!');
        return;
    }

    // توزيع عشوائي بالكامل لكل لاعب من الأدوار المفعلة (يمكن تكرار أي دور بحرية)
    let rolesPool = [];
    for (let i = 0; i < players.length; i++) {
        let randomRole = availableRoleTypes[Math.floor(Math.random() * availableRoleTypes.length)];
        rolesPool.push(randomRole);
    }

    // ضمان وجود مستذئب واحد على الأقل في اللعبة كشرط أساسي
    if (!rolesPool.some(r => r.includes('مستذئب'))) {
        let randomIndex = Math.floor(Math.random() * rolesPool.length);
        rolesPool[randomIndex] = 'مستذئب 🐺';
    }

    players = players.map((p, index) => {
        return {
            name: p.name,
            role: rolesPool[index],
            isAlive: true
        };
    });

    setupScreen.classList.remove('active');
    startNewNight();
});

function startNewNight() {
    if (checkWinCondition()) return;

    werewolfTargets = [];
    doctorTargets = [];
    witchElixirActiveThisNight = false;
    witchPoisonTargets = [];

    nightScreen.classList.add('active');
    currentTurnIndex = 0;
    startTurn();
}

function startTurn() {
    while (currentTurnIndex < players.length && !players[currentTurnIndex].isAlive) {
        currentTurnIndex++;
    }

    if (currentTurnIndex >= players.length) {
        endNightAndShowMorning();
        return;
    }

    const currentPlayer = players[currentTurnIndex];
    currentTurnPlayerSpan.textContent = currentPlayer.name;
    
    roleBox.innerHTML = `
        <div class="lock-icon">🔒</div>
        <p>اضغط هنا لكشف دورك سراً</p>
    `;
    roleBox.classList.remove('revealed');
    nextTurnBtn.style.display = 'none';
}

roleBox.addEventListener('click', () => {
    if (roleBox.classList.contains('revealed')) return;

    const currentPlayer = players[currentTurnIndex];

    if (currentPlayer.role.includes('مستذئب')) {
        let targetsHtml = `
            <p style="color:var(--danger-color); font-weight:900; margin-bottom: 6px;">دورك: مستذئب 🐺<br><span style="font-size:0.75rem; color:#d1d5db;">اختر ضحيتك:</span></p>
            <div class="targets-grid" style="max-height:140px;">
        `;
        players.forEach(p => {
            if (p.isAlive && p.name !== currentPlayer.name) {
                targetsHtml += `<button class="target-btn ww-target" data-name="${p.name}">${p.name}</button>`;
            }
        });
        targetsHtml += `</div>`;
        roleBox.innerHTML = targetsHtml;
        roleBox.classList.add('revealed');

        document.querySelectorAll('.ww-target').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                werewolfTargets.push(players.find(p => p.name === btn.getAttribute('data-name')));
                currentTurnIndex++;
                startTurn();
            });
        });

    } else if (currentPlayer.role.includes('دكتور')) {
        let lastProtected = lastDoctorTargets[currentPlayer.name];
        let targetsHtml = `
            <p style="color:#34d399; font-weight:900; margin-bottom: 6px;">دورك: الدكتور 💉<br><span style="font-size:0.75rem; color:#d1d5db;">اختر شخصاً لحمايته:</span></p>
            <div class="targets-grid" style="max-height:140px;">
        `;
        players.forEach(p => {
            if (p.isAlive) {
                if (p.name === lastProtected) {
                    targetsHtml += `<button class="target-btn" style="opacity: 0.4; cursor: not-allowed;" disabled>${p.name} (محمي في الليلة السابقة)</button>`;
                } else {
                    targetsHtml += `<button class="target-btn doc-target" data-name="${p.name}">${p.name}</button>`;
                }
            }
        });
        targetsHtml += `</div>`;
        roleBox.innerHTML = targetsHtml;
        roleBox.classList.add('revealed');

        document.querySelectorAll('.doc-target').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const targetName = btn.getAttribute('data-name');
                doctorTargets.push(players.find(p => p.name === targetName));
                lastDoctorTargets[currentPlayer.name] = targetName;
                currentTurnIndex++;
                startTurn();
            });
        });

    } else if (currentPlayer.role.includes('ساحر')) {
        let elixirStatusText = witchElixirUsed ? "(تم استخدام الإكسير العام مسبقاً ❌)" : "(متاح للإستخدام العام ✨ يحمي الجميع)";
        let targetsHtml = `
            <p style="color:#f43f5e; font-weight:900; margin-bottom: 4px;">دورك: الساحر 🧙‍♂️</p>
            <p style="font-size: 0.75rem; color:#cbd5e1; margin-bottom:6px;">${elixirStatusText}</p>
            <div style="display:flex; gap:6px; margin-bottom:6px;">
                <button id="witch-mode-elixir" class="secondary-btn" style="font-size:0.8rem; padding:6px; background:${!witchElixirUsed?'#7c3aed':'#1f2937'}">تفعيل الإكسير (للجميع)</button>
                <button id="witch-mode-poison" class="secondary-btn" style="font-size:0.8rem; padding:6px; background:#dc2626">استخدام السم</button>
            </div>
            <div id="witch-action-box"></div>
        `;
        roleBox.innerHTML = targetsHtml;
        roleBox.classList.add('revealed');

        document.getElementById('witch-mode-elixir').addEventListener('click', (e) => {
            e.stopPropagation();
            if (witchElixirUsed) {
                alert('لقد استخدمت إكسير الحماية العام مسبقاً!');
                return;
            }
            witchElixirActiveThisNight = true;
            witchElixirUsed = true;
            alert('تم تفعيل إكسير الحماية ليحمي الجميع هذه الليلة!');
            currentTurnIndex++;
            startTurn();
        });

        document.getElementById('witch-mode-poison').addEventListener('click', (e) => {
            e.stopPropagation();
            let html = `<p style="font-size:0.8rem; color:#f87171; margin-bottom:4px;">اختر من تريد تسميمه:</p><div class="targets-grid" style="max-height:100px;">`;
            players.forEach(p => {
                if (p.isAlive && p.name !== currentPlayer.name) {
                    html += `<button class="target-btn poison-target" data-name="${p.name}">${p.name}</button>`;
                }
            });
            html += `</div><button id="skip-poison-btn" class="secondary-btn" style="margin-top:4px; padding:6px; font-size:0.8rem;">تخطي السم</button>`;
            document.getElementById('witch-action-box').innerHTML = html;

            document.querySelectorAll('.poison-target').forEach(btn => {
                btn.addEventListener('click', (ev) => {
                    ev.stopPropagation();
                    witchPoisonTargets.push(players.find(p => p.name === btn.getAttribute('data-name')));
                    currentTurnIndex++;
                    startTurn();
                });
            });

            const skipBtn = document.getElementById('skip-poison-btn');
            if(skipBtn) {
                skipBtn.addEventListener('click', (ev) => {
                    ev.stopPropagation();
                    currentTurnIndex++;
                    startTurn();
                });
            }
        });

    } else if (currentPlayer.role.includes('عراف')) {
        let targetsHtml = `
            <p style="color:#60a5fa; font-weight:900; margin-bottom: 6px;">دورك: العراف 🔮<br><span style="font-size:0.75rem; color:#d1d5db;">اختر لاعباً لكشف دوره:</span></p>
            <div class="targets-grid" style="max-height:140px;">
        `;
        players.forEach(p => {
            if (p.isAlive && p.name !== currentPlayer.name) {
                targetsHtml += `<button class="target-btn seer-target" data-name="${p.name}">${p.name}</button>`;
            }
        });
        targetsHtml += `</div>`;
        roleBox.innerHTML = targetsHtml;
        roleBox.classList.add('revealed');

        document.querySelectorAll('.seer-target').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const targetObj = players.find(p => p.name === btn.getAttribute('data-name'));
                alert(`كشف العراف: دور اللاعب [${targetObj.name}] هو (${targetObj.role})`);
                currentTurnIndex++;
                startTurn();
            });
        });

    } else {
        roleBox.innerHTML = `
            <h3 style="margin-bottom: 5px;">دورك هو: <span style="color: #34d399">قروي 🧑</span></h3>
            <p style="font-size: 0.78rem; color: #9ca3af;">تأكد أن لا أحد يراقب شاشتك، ثم اضغط التالي لتمرير الهاتف</p>
        `;
        roleBox.classList.add('revealed');
        nextTurnBtn.style.display = 'block';
    }
});

nextTurnBtn.addEventListener('click', () => {
    currentTurnIndex++;
    startTurn();
});

function endNightAndShowMorning() {
    nightScreen.classList.remove('active');
    morningScreen.classList.add('active');

    let deadThisNight = [];

    witchPoisonTargets.forEach(target => {
        if (target && target.isAlive) {
            target.isAlive = false;
            if (!deadThisNight.includes(target.name)) deadThisNight.push(target.name);
        }
    });

    if (!witchElixirActiveThisNight) {
        werewolfTargets.forEach(target => {
            if (target && target.isAlive) {
                const isProtectedByDoc = doctorTargets.some(doc => doc && doc.name === target.name);
                if (!isProtectedByDoc) {
                    target.isAlive = false;
                    if (!deadThisNight.includes(target.name)) deadThisNight.push(target.name);
                }
            }
        });
    }

    if (deadThisNight.length > 0) {
        let namesText = deadThisNight.map(n => `<b>${n}</b>`).join('، ');
        morningResultText.innerHTML = `استيقظت القرية على خبر مفجع... ☀️<br><br>لقد تم العثور على الشخص التالي ميتًا: ${namesText}`;
    } else {
        morningResultText.innerHTML = `مرت الليلة بسلام وأمان واستيقظ الجميع أحياء... ☀️<br><br>لم يتقابل أي شخص مصير الموت هذه الليلة.`;
    }
}

goToVoteBtn.addEventListener('click', () => {
    morningScreen.classList.remove('active');
    
    if (checkWinCondition()) return;

    voteScreen.classList.add('active');
    voteCounts = {};
    skipVotesCount = 0;
    currentVoterIndex = 0;
    startNextVoterTurn();
});

function startNextVoterTurn() {
    while (currentVoterIndex < players.length && !players[currentVoterIndex].isAlive) {
        currentVoterIndex++;
    }

    if (currentVoterIndex >= players.length) {
        processVoteResults();
        return;
    }

    const voter = players[currentVoterIndex];
    currentVoterNameSpan.textContent = voter.name;

    voteTargetsList.innerHTML = '';
    players.forEach(p => {
        if (p.isAlive && p.name !== voter.name) {
            const btn = document.createElement('button');
            btn.className = 'target-btn';
            btn.textContent = `تصويت ضد: ${p.name}`;
            btn.addEventListener('click', () => {
                voteCounts[p.name] = (voteCounts[p.name] || 0) + 1;
                currentVoterIndex++;
                startNextVoterTurn();
            });
            voteTargetsList.appendChild(btn);
        }
    });
}

skipSingleVoteBtn.addEventListener('click', () => {
    skipVotesCount++;
    currentVoterIndex++;
    startNextVoterTurn();
});

function processVoteResults() {
    voteScreen.classList.remove('active');

    let maxVotes = 0;
    let mostVotedPlayerName = null;

    for (let name in voteCounts) {
        if (voteCounts[name] > maxVotes) {
            maxVotes = voteCounts[name];
            mostVotedPlayerName = name;
        }
    }

    if (skipVotesCount >= maxVotes) {
        alert(`قررت القرية تخطي التصويت هذه المرة (عدد أصوات التخطي: ${skipVotesCount}) ولم يتم طرد أحد!`);
    } else if (mostVotedPlayerName && maxVotes > 0) {
        const eliminated = players.find(p => p.name === mostVotedPlayerName);
        if (eliminated) {
            eliminated.isAlive = false;
            alert(`قررت القرية طرد ${eliminated.name} بناءً على التصويت!`);
        }
    } else {
        alert("انتهى وقت التصويت ولم يتم طرد أحد.");
    }

    startNewNight();
}

function checkWinCondition() {
    const alivePlayers = players.filter(p => p.isAlive);
    const aliveWerewolf = alivePlayers.find(p => p.role.includes('مستذئب'));
    const aliveVillagersAndSpecial = alivePlayers.filter(p => !p.role.includes('مستذئب'));

    if (!aliveWerewolf) {
        showGameOver("فاز القرويون والفريق الطيب! 🧑🏆<br>تم القضاء على المستذئب وتطهير القرية.");
        return true;
    } else if (aliveVillagersAndSpecial.length <= 1) {
        showGameOver("فاز المستذئب 🐺🏆<br>قضى المستذئب على جميع سكان القرية!");
        return true;
    }
    return false;
}

function showGameOver(text) {
    nightScreen.classList.remove('active');
    morningScreen.classList.remove('active');
    voteScreen.classList.remove('active');
    gameOverScreen.classList.add('active');
    gameOverText.innerHTML = text;
}

restartBtn.addEventListener('click', () => {
    players = [];
    currentTurnIndex = 0;
    werewolfTargets = [];
    doctorTargets = [];
    witchElixirUsed = false;
    witchElixirActiveThisNight = false;
    witchPoisonTargets = [];
    lastDoctorTargets = {};
    updatePlayersUI();
    gameOverScreen.classList.remove('active');
    setupScreen.classList.add('active');
    roleBox.classList.remove('revealed');
});