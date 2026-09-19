"use strict";

/* =========================================================
   MAFIA — FULL GAME ENGINE
   ========================================================= */


/* =========================================================
   ELEMENT HELPER
   ========================================================= */

const $ = (id) =>
  document.getElementById(id);


/* =========================================================
   SCREENS
   ========================================================= */

const screens = [
  "loadingScreen",
  "homeScreen",
  "playersScreen",
  "rolesSetupScreen",
  "reviewScreen",
  "roleScreen",
  "actionScreen",
  "passScreen",
  "nightResultScreen",
  "discussionScreen",
  "votingScreen",
  "voteResultScreen",
  "winnerScreen"
];


/* =========================================================
   ROLES
   ========================================================= */

const ROLES = {

  werewolf: {
    name: "القاتل",
    icon: "🔪",
    team: "wolves",
    teamName: "فريق القتلة",
    description:
      "استهدف أحد اللاعبين في الليل مع بقية القتلة."
  },

  doctor: {
    name: "الطبيب",
    icon: "👨‍⚕️",
    team: "village",
    teamName: "فريق القرية",
    description:
      "اختر لاعبًا لتحميه من هجوم القتلة هذه الليلة."
  },

  seer: {
    name: "العرّاف",
    icon: "🔮",
    team: "village",
    teamName: "فريق القرية",
    description:
      "اكشف فريق لاعب واحد، ثم استخدم المعلومة لمساعدة القرية."
  },

  witch: {
    name: "الساحر",
    icon: "🧙",
    team: "village",
    teamName: "فريق القرية",
    description:
      "لديك إكسير شفاء مرة واحدة وسم مرة واحدة طوال اللعبة."
  },

  hunter: {
    name: "الصياد",
    icon: "🏹",
    team: "village",
    teamName: "فريق القرية",
    description:
      "إذا خرجت من اللعبة، يمكنك اختيار لاعب ليخرج معك."
  },

  villager: {
    name: "القروي",
    icon: "👨‍🌾",
    team: "village",
    teamName: "فريق القرية",
    description:
      "ليس لديك قدرة خاصة. استخدم النقاش والتصويت لاكتشاف القتلة."
  }

};


/* =========================================================
   STATE
   ========================================================= */

const state = {

  players: [],

  activeRoles: {
    werewolf: true,
    doctor: true,
    seer: true,
    witch: true,
    hunter: true,
    villager: false
  },

  distributionMode: "random",

  night: 1,

  nightOrder: [],
  nightIndex: 0,

  currentPlayer: null,

  selectedTarget: null,
  currentAction: null,

  wolfChoices: {},

  doctorTarget: null,
  seerTarget: null,

  nightPoisonTargets: [],
  nightProtectedPlayers: [],
  nightDeaths: [],

  witchStates: {},

  passMode: null,

  votingOrder: [],
  votingIndex: 0,
  votes: {},
  selectedVote: null,

  discussionSeconds: 120,
  discussionInterval: null,

  hunterQueue: [],
  hunterMode: null,

  modalCallback: null,

  started: false,

  manualRoles: {},

  transitionLock: false,

  votingResolved: false,

  nightResolved: false,

  actionLocked: false,

  voteLocked: false

};


/* =========================================================
   AUDIO SYSTEM
   =========================================================
   
   مهم:
   الموسيقى الطويلة للواجهات تتحكم بها showScreen().
   
   audioSystem هنا مسؤول فقط عن:
   1.mp3 = صوت الأزرار
   3.mp3 = صوت التصويت
   ========================================================= */

const audioSystem = {

  audioConfig: {

    clickSoundPath: "./1.mp3",
    votingSoundPath: "./3.mp3",

    clickVolume: 0.6,
    votingVolume: 0.7

  },

  votingAudioInstance: null,

  isUserMuted: false,


  init() {

    this.setupVotingSound();
    this.setupButtonSounds();

  },


  setupVotingSound() {

    this.votingAudioInstance =
      new Audio(
        this.audioConfig.votingSoundPath
      );

    this.votingAudioInstance.volume =
      this.audioConfig.votingVolume;

    this.votingAudioInstance.preload =
      "auto";

  },


  setupButtonSounds() {

    document.addEventListener(
      "click",
      event => {

        const button =
          event.target.closest(
            "button"
          );

        if (!button) return;

        /*
         * أزرار اختيار اللاعب لا نريد
         * أن تصدر صوت زر عادي.
         */

        if (
          button.closest(
            "#votingTargets"
          )
        ) {

          return;

        }

        if (
          button.closest(
            "#actionTargets"
          )
        ) {

          return;

        }

        this.playButtonSound();

      }
    );

  },


  playButtonSound() {

    if (
      this.isUserMuted
    ) {

      return;
    }

    try {

      const audio =
        new Audio(
          this.audioConfig.clickSoundPath
        );

      audio.volume =
        this.audioConfig.clickVolume;

      audio.currentTime =
        0;

      audio.play()
        .catch(() => {});

    } catch (error) {

      console.log(
        "خطأ صوت الزر:",
        error
      );

    }

  },


  playVotingSound() {

    if (
      this.isUserMuted
    ) {

      return;
    }

    if (
      !this.votingAudioInstance
    ) {

      this.setupVotingSound();

    }

    this.votingAudioInstance
      .currentTime = 0;

    this.votingAudioInstance
      .play()
      .catch(() => {});

  },


  toggleMute() {

    this.isUserMuted =
      !this.isUserMuted;


    if (
      this.isUserMuted
    ) {

      stopInterfaceMusic();

      if (
        this.votingAudioInstance
      ) {

        this.votingAudioInstance
          .pause();

        try {

          this.votingAudioInstance
            .currentTime = 0;

        } catch (error) {}

      }

    } else {

      /*
       * إعادة الموسيقى حسب الواجهة الحالية
       */

      const activeScreen =
        screens.find(
          id =>
            $(id)?.classList.contains(
              "active"
            )
        );

      if (activeScreen) {

        showScreen(
          activeScreen
        );

      }

    }

  },


  setClickVolume(volume) {

    this.audioConfig.clickVolume =
      volume;

  },


  setVotingVolume(volume) {

    this.audioConfig.votingVolume =
      volume;

    if (
      this.votingAudioInstance
    ) {

      this.votingAudioInstance
        .volume = volume;

    }

  },

  /*
   * دالة توافقية حتى لو بقي استدعاء قديم
   * في أي مكان بالملف.
   */

  stopAllGameAudio() {

    stopInterfaceMusic();

    if (
      this.votingAudioInstance
    ) {

      this.votingAudioInstance
        .pause();

      try {

        this.votingAudioInstance
          .currentTime = 0;

      } catch (error) {}

    }

  }

};


/* =========================================================
   INTERFACE AUDIO
   ========================================================= */

function getInterfaceAudio(
  id,
  src
) {

  let audio =
    $(id);

  if (!audio) {

    audio =
      document.createElement(
        "audio"
      );

    audio.id =
      id;

    audio.src =
      src;

    audio.preload =
      "auto";

    document.body.appendChild(
      audio
    );

  }

  return audio;
}


function getBgMusic() {

  return getInterfaceAudio(
    "bgMusic",
    "./2.mp3"
  );

}


function getDiscussionMusic() {

  return getInterfaceAudio(
    "discussionMusic",
    "./6.mp3"
  );

}


function getVillageWinMusic() {

  return getInterfaceAudio(
    "villageWinMusic",
    "./4.mp3"
  );

}


function getMercenariesWinMusic() {

  return getInterfaceAudio(
    "mercenariesWinMusic",
    "./5.mp3"
  );

}


/* =========================================================
   STOP INTERFACE MUSIC
   ========================================================= */

function stopInterfaceMusic() {

  [

    getBgMusic(),
    getDiscussionMusic(),
    getVillageWinMusic(),
    getMercenariesWinMusic()

  ].forEach(
    audio => {

      if (!audio) return;

      audio.pause();

      try {

        audio.currentTime = 0;

      } catch (error) {}

    }
  );

}


/* =========================================================
   PLAY INTERFACE MUSIC
   ========================================================= */

function playInterfaceMusic(
  id
) {

  if (
    audioSystem.isUserMuted
  ) {

    return;

  }


  const bgMusic =
    getBgMusic();

  const discussionMusic =
    getDiscussionMusic();

  const villageWinMusic =
    getVillageWinMusic();

  const mercenariesWinMusic =
    getMercenariesWinMusic();


  /*
   * إيقاف الموسيقى السابقة
   */

  [
    bgMusic,
    discussionMusic,
    villageWinMusic,
    mercenariesWinMusic

  ].forEach(
    audio => {

      if (!audio) return;

      audio.pause();

      try {

        audio.currentTime = 0;

      } catch (error) {}

    }
  );


  /*
   * الرئيسية
   */

  const mainScreens = [

    "homeScreen",
    "playersScreen",
    "rolesSetupScreen",
    "reviewScreen",
    "roleScreen",
    "actionScreen",
    "passScreen",
    "nightResultScreen",
    "votingScreen",
    "voteResultScreen"

  ];


  if (
    mainScreens.includes(id)
  ) {

    bgMusic.loop =
      true;

    bgMusic.volume =
      0.25;

    bgMusic.play()
      .catch(() => {});

    return;

  }


  /*
   * النقاش
   */

  if (
    id ===
    "discussionScreen"
  ) {

    discussionMusic.loop =
      true;

    discussionMusic.volume =
      0.5;

    discussionMusic.play()
      .catch(() => {});

    return;

  }

}


/* =========================================================
   ELEMENT / UTILITY
   ========================================================= */

function randomId() {

  return (
    Date.now().toString(36) +
    Math.random()
      .toString(36)
      .slice(2)
  );

}


function escapeHTML(text) {

  return String(text)
    .replaceAll(
      "&",
      "&amp;"
    )
    .replaceAll(
      "<",
      "&lt;"
    )
    .replaceAll(
      ">",
      "&gt;"
    )
    .replaceAll(
      '"',
      "&quot;"
    )
    .replaceAll(
      "'",
      "&#039;"
    );

}


function shuffle(array) {

  const arr =
    [...array];

  for (
    let i = arr.length - 1;
    i > 0;
    i--
  ) {

    const j =
      Math.floor(
        Math.random() *
        (i + 1)
      );

    [
      arr[i],
      arr[j]
    ] =
    [
      arr[j],
      arr[i]
    ];

  }

  return arr;

}


function alivePlayers() {

  return state.players.filter(
    player =>
      player.alive
  );

}


function getPlayer(id) {

  return state.players.find(
    player =>
      player.id === id
  );

}


function getRole(player) {

  return player
    ? ROLES[player.role]
    : null;

}


function getAliveWolves() {

  return alivePlayers().filter(
    player =>
      player.role ===
      "werewolf"
  );

}


function getAliveVillagers() {

  return alivePlayers().filter(
    player =>
      player.role !==
      "werewolf"
  );

}


/* =========================================================
   SCREEN
   ========================================================= */

function showScreen(id) {

  screens.forEach(
    screenId => {

      const screen =
        $(screenId);

      if (!screen) return;

      screen.classList.toggle(
        "active",
        screenId === id
      );

    }
  );


  /*
   * 🎵 موسيقى الواجهة
   */

  playInterfaceMusic(
    id
  );


  updateGameHomeButton(
    id
  );


  window.scrollTo({

    top: 0,

    behavior: "instant"

  });

}


/* =========================================================
   TOAST
   ========================================================= */

function showToast(
  message,
  type = ""
) {

  const container =
    $("toastContainer");

  if (!container) return;

  const toast =
    document.createElement(
      "div"
    );

  toast.className =
    `toast ${type}`;

  toast.textContent =
    message;

  container.appendChild(
    toast
  );

  setTimeout(
    () => {

      toast.classList.add(
        "hide"
      );

      setTimeout(
        () =>
          toast.remove(),
        250
      );

    },
    2800
  );

}


/* =========================================================
   MODAL
   ========================================================= */

function showModal(
  title,
  text,
  icon = "ℹ️",
  callback = null
) {

  const modal =
    $("modal");

  if (!modal) return;

  $("modalTitle").textContent =
    title;

  $("modalText").textContent =
    text;

  $("modalIcon").textContent =
    icon;

  state.modalCallback =
    typeof callback ===
    "function"
      ? callback
      : null;

  modal.classList.remove(
    "hidden"
  );

}


function closeModal(
  confirmed = false
) {

  const modal =
    $("modal");

  if (modal) {

    modal.classList.add(
      "hidden"
    );

  }

  const callback =
    state.modalCallback;

  state.modalCallback =
    null;

  if (
    confirmed &&
    typeof callback ===
    "function"
  ) {

    callback();

  }

}


/* =========================================================
   HOME / EXIT
   ========================================================= */

function updateGameHomeButton(
  screenId
) {

  const gameScreens = [

    "roleScreen",
    "actionScreen",
    "votingScreen"

  ];

  const isGameScreen =
    gameScreens.includes(
      screenId
    );

  document
    .querySelectorAll(
      ".game-home-btn"
    )
    .forEach(
      button => {

        button.classList.toggle(
          "game-home-visible",
          isGameScreen
        );

      }
    );

}


function confirmExitGame(
  destination = "home"
) {

  const title =
    destination === "home"
      ? "العودة إلى الرئيسية؟"
      : "الخروج من اللعبة؟";


  const text =
    destination === "home"
      ? "إذا عدت الآن ستنتهي اللعبة الحالية وسيتم فقدان التقدم. هل أنت متأكد؟"
      : "إذا خرجت الآن ستنتهي اللعبة الحالية وسيتم فقدان التقدم. هل أنت متأكد؟";


  showModal(

    title,

    text,

    destination === "home"
      ? "🏠"
      : "🚪",

    () => {

      clearInterval(
        state.discussionInterval
      );

      state.discussionInterval =
        null;

      stopInterfaceMusic();

      resetGameData();

      showScreen(
        "homeScreen"
      );

    }

  );

}


/* =========================================================
   AVATAR
   ========================================================= */

let avatarTargetId =
  null;


function openAvatarPicker(
  playerId
) {

  avatarTargetId =
    playerId;

  const input =
    $("avatarInput");

  if (!input) return;

  input.value =
    "";

  input.click();

}


function handleAvatarUpload(
  event
) {

  const file =
    event.target.files?.[0];

  if (
    !file ||
    !avatarTargetId
  ) {

    return;

  }


  if (
    !file.type.startsWith(
      "image/"
    )
  ) {

    showToast(
      "اختر ملف صورة فقط",
      "error"
    );

    avatarTargetId =
      null;

    return;

  }


  if (
    file.size >
    5 * 1024 * 1024
  ) {

    showToast(
      "حجم الصورة يجب أن يكون أقل من 5MB",
      "error"
    );

    avatarTargetId =
      null;

    return;

  }


  const reader =
    new FileReader();

  const targetId =
    avatarTargetId;


  reader.onload =
    () => {

      const player =
        getPlayer(
          targetId
        );

      if (!player) return;

      player.avatar =
        reader.result;

      renderPlayerList();

      updatePlayerAvatars();

      showToast(
        "تم تغيير صورة اللاعب",
        "success"
      );

    };


  reader.onerror =
    () => {

      showToast(
        "حدث خطأ أثناء قراءة الصورة",
        "error"
      );

    };


  reader.readAsDataURL(
    file
  );

  avatarTargetId =
    null;

}


/* =========================================================
   PLAYERS
   ========================================================= */

function addPlayer() {

  const input =
    $("playerNameInput");

  if (!input) return;

  const name =
    input.value.trim();


  if (!name) {

    showToast(
      "اكتب اسم اللاعب أولًا",
      "error"
    );

    return;

  }


  if (
    state.players.length >=
    50
  ) {

    showToast(
      "الحد الأقصى هو 50 لاعبًا",
      "error"
    );

    return;

  }


  const exists =
    state.players.some(
      player =>
        player.name
          .trim()
          .toLowerCase() ===
        name.toLowerCase()
    );


  if (exists) {

    showToast(
      "هذا الاسم موجود بالفعل",
      "error"
    );

    return;

  }


  state.players.push({

    id:
      randomId(),

    name,

    avatar:
      null,

    role:
      null,

    alive:
      true

  });


  input.value =
    "";

  renderPlayerList();

  input.focus();

}


function removePlayer(
  id
) {

  state.players =
    state.players.filter(
      player =>
        player.id !== id
    );

  delete state.manualRoles[
    id
  ];

  renderPlayerList();

}


function renderPlayerList() {

  const list =
    $("playerList");

  if (!list) return;


  if (
    state.players.length ===
    0
  ) {

    list.innerHTML = `

      <div class="empty-players">

        <span>👤</span>

        <p>
          لم تتم إضافة أي لاعب بعد
        </p>

      </div>

    `;

  } else {

    list.innerHTML =
      state.players
        .map(
          (player, index) => {

            const avatar =
              player.avatar
                ? `
                  <img
                    src="${escapeHTML(
                      player.avatar
                    )}"
                    alt=""
                  >
                `
                : "👤";


            return `

              <div class="player-item">

                <div class="player-main">

                  <button
                    class="player-avatar"
                    onclick="openAvatarPicker('${player.id}')"
                    title="تغيير الصورة"
                    type="button"
                  >

                    ${avatar}

                    <span class="avatar-camera">
                      📷
                    </span>

                  </button>

                  <div class="player-name-box">

                    <span class="player-name">

                      <span class="player-number">
                        ${index + 1}
                      </span>

                      ${escapeHTML(
                        player.name
                      )}

                    </span>

                    <small class="player-sub">
                      اضغط على الصورة لتغييرها
                    </small>

                  </div>

                </div>

                <button
                  class="remove-player"
                  onclick="removePlayer('${player.id}')"
                  type="button"
                >
                  ×
                </button>

              </div>

            `;

          }
        )
        .join("");

  }


  if ($("playerCount")) {

    $("playerCount").textContent =
      state.players.length;

  }

}


/* =========================================================
   ROLE SETUP
   ========================================================= */

function toggleRole(
  role
) {

  if (
    role ===
    "werewolf"
  ) {

    showToast(
      "المستذئب دور إجباري",
      "error"
    );

    return;

  }


  if (
    !Object.prototype
      .hasOwnProperty.call(
        state.activeRoles,
        role
      )
  ) {

    return;

  }


  state.activeRoles[role] =
    !state.activeRoles[role];


  if (
    !state.activeRoles[role]
  ) {

    Object.keys(
      state.manualRoles
    ).forEach(
      playerId => {

        if (
          state.manualRoles[
            playerId
          ] === role
        ) {

          state.manualRoles[
            playerId
          ] = "";

        }

      }
    );

  }


  renderRoleOptions();

}


function renderRoleOptions() {

  document
    .querySelectorAll(
      ".role-option"
    )
    .forEach(
      button => {

        const role =
          button.dataset.role;

        const active =
          !!state.activeRoles[
            role
          ];

        button.classList.toggle(
          "active",
          active
        );


        const status =
          button.querySelector(
            ".role-power span"
          );

        if (!status) return;


        if (
          role ===
          "werewolf"
        ) {

          status.textContent =
            "إجباري";

        } else {

          status.textContent =
            active
              ? "متاح"
              : "متوقف";

        }

      }
    );


  updateRoleSummary();

}


function getSelectedRoles() {

  return Object.keys(
    state.activeRoles
  ).filter(
    role =>
      state.activeRoles[
        role
      ]
  );

}


function getSelectedSpecialRoles() {

  return getSelectedRoles()
    .filter(
      role =>
        role !==
        "werewolf"
    );

}


function getWolfCount(
  playerCount
) {

  if (
    playerCount >= 16
  ) return 4;

  if (
    playerCount >= 12
  ) return 3;

  if (
    playerCount >= 8
  ) return 2;

  return 1;

}


/* =========================================================
   DISTRIBUTION
   ========================================================= */

function setDistributionMode(
  mode
) {

  if (
    mode !== "random" &&
    mode !== "manual"
  ) {

    return;

  }


  state.distributionMode =
    mode;


  const randomButton =
    $("randomRoleModeBtn");

  const manualButton =
    $("manualRoleModeBtn");


  randomButton?.classList.toggle(
    "active",
    mode === "random"
  );

  manualButton?.classList.toggle(
    "active",
    mode === "manual"
  );


  const description =
    $("roleModeDescription");


  if (description) {

    description.textContent =
      mode === "random"
        ? "سيتم توزيع الأدوار المختارة عشوائيًا."
        : "سيتم اختيار دور كل لاعب يدويًا.";

  }


  updateRoleSummary();

}


function updateRoleSummary() {

  const summary =
    $("roleSummaryText");

  if (!summary) return;


  if (
    state.distributionMode ===
    "manual"
  ) {

    summary.textContent =
      "سيتم اختيار دور كل لاعب يدويًا.";

  } else {

    summary.textContent =
      "سيتم توزيع الأدوار المختارة عشوائيًا.";

  }

}


/* =========================================================
   VALIDATE ROLE SETUP
   ========================================================= */

function validateRoleSetup() {

  const playerCount =
    state.players.length;


  if (
    playerCount < 3
  ) {

    showToast(
      "أضف 3 لاعبين على الأقل أولًا",
      "error"
    );

    return false;

  }


  if (
    playerCount > 50
  ) {

    showToast(
      "الحد الأقصى هو 50 لاعبًا",
      "error"
    );

    return false;

  }


  const active =
    getSelectedRoles();


  if (
    !active.includes(
      "werewolf"
    )
  ) {

    showToast(
      "يجب أن يكون القاتل مفعّلًا",
      "error"
    );

    return false;

  }


  return true;

}


/* =========================================================
   RANDOM ROLES
   ========================================================= */

function buildRandomRoles() {

  const count =
    state.players.length;


  const available =
    getSelectedRoles();


  if (
    !available.includes(
      "werewolf"
    )
  ) {

    available.unshift(
      "werewolf"
    );

  }


  const wolfCount =
    Math.min(
      getWolfCount(count),
      count
    );


  const roles =
    [];


  for (
    let i = 0;
    i < wolfCount;
    i++
  ) {

    roles.push(
      "werewolf"
    );

  }


  const nonWolfRoles =
    available.filter(
      role =>
        role !==
        "werewolf"
    );


  if (
    nonWolfRoles.length ===
    0
  ) {

    while (
      roles.length <
      count
    ) {

      roles.push(
        "villager"
      );

    }

    return shuffle(
      roles
    );

  }


  while (
    roles.length <
    count
  ) {

    const index =
      Math.floor(
        Math.random() *
        nonWolfRoles.length
      );

    roles.push(
      nonWolfRoles[index]
    );

  }


  return shuffle(
    roles
  );

}


/* =========================================================
   MANUAL ROLES
   ========================================================= */

function buildManualRoles() {

  const roles =
    [];


  for (
    const player of
    state.players
  ) {

    const role =
      state.manualRoles[
        player.id
      ];


    if (!role) {

      showToast(
        `اختر دور اللاعب ${player.name}`,
        "error"
      );

      return null;

    }


    if (
      role !==
      "werewolf" &&
      !state.activeRoles[
        role
      ]
    ) {

      showToast(
        `الدور المختار للاعب ${player.name} متوقف`,
        "error"
      );

      return null;

    }


    roles.push(
      role
    );

  }


  if (
    !roles.includes(
      "werewolf"
    )
  ) {

    showToast(
      "يجب أن يكون هناك قاتل واحد على الأقل",
      "error"
    );

    return null;

  }


  return roles;

}


/* =========================================================
   MANUAL ASSIGNMENT
   ========================================================= */

function renderManualAssignment() {

  const list =
    $("reviewRolesList");

  if (!list) return;


  list.innerHTML = `

    <div class="manual-assignment">

      <div class="manual-header">

        <strong>
          توزيع الأدوار يدويًا
        </strong>

        <small>
          اختر دور كل لاعب من الأدوار التي فعّلتها.
        </small>

      </div>

      <div class="manual-player-list">

        ${
          state.players
            .map(
              (player, index) => {

                const selected =
                  state.manualRoles[
                    player.id
                  ] || "";


                return `

                  <div class="manual-player">

                    <div class="manual-player-info">

                      <span class="manual-number">
                        ${index + 1}
                      </span>

                      ${
                        player.avatar
                          ? `
                            <img
                              src="${escapeHTML(
                                player.avatar
                              )}"
                              alt=""
                              class="manual-avatar"
                            >
                          `
                          : `
                            <div class="manual-avatar">
                              👤
                            </div>
                          `
                      }

                      <strong>
                        ${escapeHTML(
                          player.name
                        )}
                      </strong>

                    </div>

                    <select
                      class="manual-role-select"
                      data-player-id="${player.id}"
                    >

                      <option value="">
                        اختر الدور
                      </option>

                      ${
                        getSelectedRoles()
                          .map(
                            role => `

                              <option
                                value="${role}"
                                ${
                                  selected ===
                                  role
                                    ? "selected"
                                    : ""
                                }
                              >
                                ${ROLES[role].icon}
                                ${ROLES[role].name}
                              </option>

                            `
                          )
                          .join("")
                      }

                    </select>

                  </div>

                `;

              }
            )
            .join("")
        }

      </div>

    </div>

  `;


  list
    .querySelectorAll(
      ".manual-role-select"
    )
    .forEach(
      select => {

        select.addEventListener(
          "change",
          () => {

            state.manualRoles[
              select.dataset
                .playerId
            ] =
              select.value;

          }
        );

      }
    );

}


/* =========================================================
   REVIEW
   ========================================================= */

function prepareReview() {

  if (
    !validateRoleSetup()
  ) {

    return;

  }


  if (
    state.distributionMode ===
    "manual"
  ) {

    state.players.forEach(
      player => {

        if (
          !Object.prototype
            .hasOwnProperty.call(
              state.manualRoles,
              player.id
            )
        ) {

          state.manualRoles[
            player.id
          ] = "";

        }

      }
    );


    renderManualAssignment();

  } else {

    const list =
      $("reviewRolesList");


    if (list) {

      list.innerHTML = `

        <div class="random-review">

          <div class="random-review-icon">
            🎲
          </div>

          <h3>
            التوزيع العشوائي جاهز
          </h3>

          <p>
            سيتم توزيع الأدوار التي اخترتها
            بشكل عشوائي عند بدء اللعبة.
          </p>

          <div class="random-review-note">
            🔒 لن يظهر دور أي لاعب قبل أن يكشفه بنفسه.
          </div>

        </div>

      `;

    }

  }


  [
    "reviewPlayerCount",
    "reviewWolfCount",
    "reviewSpecialCount"
  ].forEach(
    id => {

      const el =
        $(id);

      if (el) {

        el.textContent =
          "—";

      }

    }
  );


  if (
    $("reviewDistributionMode")
  ) {

    $("reviewDistributionMode")
      .textContent =
      state.distributionMode ===
      "random"
        ? "عشوائي"
        : "يدوي";

  }


  showScreen(
    "reviewScreen"
  );

}


/* =========================================================
   RESET
   ========================================================= */

function resetGameData() {

  clearInterval(
    state.discussionInterval
  );

  state.discussionInterval =
    null;


  stopInterfaceMusic();


  state.players =
    [];

  state.night =
    1;

  state.nightOrder =
    [];

  state.nightIndex =
    0;

  state.currentPlayer =
    null;

  state.selectedTarget =
    null;

  state.currentAction =
    null;

  state.wolfChoices =
    {};

  state.doctorTarget =
    null;

  state.seerTarget =
    null;

  state.nightPoisonTargets =
    [];

  state.nightProtectedPlayers =
    [];

  state.nightDeaths =
    [];

  state.witchStates =
    {};

  state.passMode =
    null;

  state.votingOrder =
    [];

  state.votingIndex =
    0;

  state.votes =
    {};

  state.selectedVote =
    null;

  state.hunterQueue =
    [];

  state.hunterMode =
    null;

  state.started =
    false;

  state.manualRoles =
    {};

  state.transitionLock =
    false;

  state.votingResolved =
    false;

  state.nightResolved =
    false;

  state.actionLocked =
    false;

  state.voteLocked =
    false;

  state.modalCallback =
    null;

}


/* =========================================================
   START GAME
   ========================================================= */

function startGame() {

  if (
    state.transitionLock
  ) {

    return;

  }


  if (
    !validateRoleSetup()
  ) {

    return;

  }


  let roles;


  if (
    state.distributionMode ===
    "manual"
  ) {

    roles =
      buildManualRoles();

    if (!roles) {

      return;

    }

  } else {

    roles =
      buildRandomRoles();

  }


  state.players.forEach(
    (player, index) => {

      player.role =
        roles[index];

      player.alive =
        true;

    }
  );


  state.night =
    1;

  state.currentPlayer =
    null;

  state.wolfChoices =
    {};

  state.doctorTarget =
    null;

  state.seerTarget =
    null;

  state.nightPoisonTargets =
    [];

  state.nightProtectedPlayers =
    [];

  state.nightDeaths =
    [];

  state.witchStates =
    {};

  state.passMode =
    null;

  state.votingOrder =
    [];

  state.votingIndex =
    0;

  state.votes =
    {};

  state.selectedVote =
    null;

  state.hunterQueue =
    [];

  state.hunterMode =
    null;

  state.started =
    true;

  state.transitionLock =
    false;

  state.votingResolved =
    false;

  state.nightResolved =
    false;

  state.actionLocked =
    false;

  state.voteLocked =
    false;


  /*
   * كل ساحر عنده حالة خاصة به
   */

  state.players.forEach(
    player => {

      if (
        player.role ===
        "witch"
      ) {

        state.witchStates[
          player.id
        ] = {

          healUsed:
            false,

          poisonUsed:
            false

        };

      }

    }
  );


  beginNight();

}


/* =========================================================
   BEGIN NIGHT
   ========================================================= */

function beginNight() {

  state.nightResolved =
    false;

  state.votingResolved =
    false;

  state.voteLocked =
    false;

  state.actionLocked =
    false;

  state.transitionLock =
    false;


  const alive =
    alivePlayers();


  state.nightOrder =
    [...alive].sort(
      (a, b) =>
        a.name.localeCompare(
          b.name,
          "ar"
        )
    );


  state.nightIndex =
    0;


  state.wolfChoices =
    {};

  state.doctorTarget =
    null;

  state.seerTarget =
    null;

  state.nightPoisonTargets =
    [];

  state.nightProtectedPlayers =
    [];

  state.nightDeaths =
    [];


  if (
    $("nightNumber")
  ) {

    $("nightNumber")
      .textContent =
      state.night;

  }


  showNextNightPlayer();

}


/* =========================================================
   NEXT NIGHT PLAYER
   ========================================================= */

function showNextNightPlayer() {

  if (
    state.nightResolved
  ) {

    return;

  }


  while (
    state.nightIndex <
      state.nightOrder.length &&
    !getPlayer(
      state.nightOrder[
        state.nightIndex
      ].id
    )?.alive
  ) {

    state.nightIndex++;

  }


  if (
    state.nightIndex >=
    state.nightOrder.length
  ) {

    resolveNight();

    return;

  }


  const player =
    state.nightOrder[
      state.nightIndex
    ];


  state.currentPlayer =
    player;

  state.selectedTarget =
    null;

  state.currentAction =
    null;

  state.actionLocked =
    false;


  resetRoleScreen();


  if (
    $("currentPlayerName")
  ) {

    $("currentPlayerName")
      .textContent =
      player.name;

  }


  if (
    $("nightNumber")
  ) {

    $("nightNumber")
      .textContent =
      state.night;

  }


  updatePlayerAvatars();


  showScreen(
    "roleScreen"
  );

}


/* =========================================================
   AVATAR ELEMENT
   ========================================================= */

function setAvatarElement(
  element,
  player
) {

  if (
    !element ||
    !player
  ) {

    return;

  }


  if (
    player.avatar
  ) {

    element.innerHTML = `

      <img
        src="${escapeHTML(
          player.avatar
        )}"
        alt=""
      >

    `;

  } else {

    element.textContent =
      "👤";

  }

}


function updatePlayerAvatars() {

  const player =
    state.currentPlayer;

  if (!player) return;


  setAvatarElement(
    $("currentPlayerAvatar"),
    player
  );

  setAvatarElement(
    $("actionPlayerAvatar"),
    player
  );

  setAvatarElement(
    $("passPlayerAvatar"),
    player
  );

  setAvatarElement(
    $("votingPlayerAvatar"),
    player
  );

}


/* =========================================================
   ROLE SCREEN
   ========================================================= */

function resetRoleScreen() {

  const hidden =
    $("roleHiddenArea");

  const revealed =
    $("roleRevealedArea");


  if (hidden) {

    hidden.classList.remove(
      "hidden"
    );

  }


  if (revealed) {

    revealed.classList.add(
      "hidden"
    );

  }


  if (
    $("roleIcon")
  ) {

    $("roleIcon")
      .textContent =
      "❓";

  }


  if (
    $("roleName")
  ) {

    $("roleName")
      .textContent =
      "الدور";

  }


  if (
    $("teamBadge")
  ) {

    $("teamBadge")
      .textContent =
      "";

  }


  if (
    $("roleDescription")
  ) {

    $("roleDescription")
      .textContent =
      "";

  }

}


/* =========================================================
   REVEAL ROLE
   ========================================================= */

function revealRole() {

  const player =
    state.currentPlayer;

  if (!player) return;


  const role =
    getRole(player);

  if (!role) return;


  if (
    $("roleIcon")
  ) {

    $("roleIcon")
      .textContent =
      role.icon;

  }


  if (
    $("roleName")
  ) {

    $("roleName")
      .textContent =
      role.name;

  }


  if (
    $("teamBadge")
  ) {

    $("teamBadge")
      .textContent =
      role.teamName;

  }


  if (
    $("roleDescription")
  ) {

    $("roleDescription")
      .textContent =
      role.description;

  }


  $("roleHiddenArea")
    ?.classList.add(
      "hidden"
    );

  $("roleRevealedArea")
    ?.classList.remove(
      "hidden"
    );

}


/* =========================================================
   CONTINUE ROLE
   ========================================================= */

function continueRole() {

  const player =
    state.currentPlayer;

  if (!player) return;


  showActionForPlayer(
    player
  );

}


/* =========================================================
   ACTION SCREEN
   ========================================================= */

function showActionForPlayer(
  player
) {

  state.selectedTarget =
    null;

  state.currentAction =
    null;

  state.actionLocked =
    false;


  if (
    $("actionPlayerName")
  ) {

    $("actionPlayerName")
      .textContent =
      player.name;

  }


  if (
    $("actionNightNumber")
  ) {

    $("actionNightNumber")
      .textContent =
      state.night;

  }


  state.currentPlayer =
    player;


  updatePlayerAvatars();


  $("confirmActionBtn")
    ?.classList.add(
      "hidden"
    );

  $("skipActionBtn")
    ?.classList.add(
      "hidden"
    );


  $("confirmActionBtn")
    ?.removeAttribute(
      "disabled"
    );

  $("skipActionBtn")
    ?.removeAttribute(
      "disabled"
    );


  if (
    $("actionTargets")
  ) {

    $("actionTargets")
      .innerHTML =
      "";

  }


  switch (
    player.role
  ) {

    case "werewolf":

      setupWolfAction(
        player
      );

      break;


    case "doctor":

      setupDoctorAction(
        player
      );

      break;


    case "seer":

      setupSeerAction(
        player
      );

      break;


    case "witch":

      setupWitchAction(
        player
      );

      break;


    case "hunter":

      setupHunterNightAction(
        player
      );

      break;


    default:

      setupVillagerAction(
        player
      );

      break;

  }


  showScreen(
    "actionScreen"
  );

}


/* =========================================================
   TARGET RENDER
   ========================================================= */

function renderTargets(
  players,
  allowSkip = false
) {

  const container =
    $("actionTargets");

  if (!container) return;


  container.innerHTML =
    players.length

      ? players
          .map(
            player => `

              <button
                class="target-btn"
                data-target-id="${player.id}"
                type="button"
              >

                <span class="target-player-info">

                  ${
                    player.avatar
                      ? `
                        <img
                          src="${escapeHTML(
                            player.avatar
                          )}"
                          alt=""
                          class="target-avatar"
                        >
                      `
                      : `
                        <span class="target-avatar target-avatar-empty">
                          👤
                        </span>
                      `
                  }

                  <span>
                    ${escapeHTML(
                      player.name
                    )}
                  </span>

                </span>

                <span>›</span>

              </button>

            `
          )
          .join("")

      : `

          <div class="hint">
            لا يوجد لاعب متاح.
          </div>

        `;


  container
    .querySelectorAll(
      ".target-btn"
    )
    .forEach(
      button => {

        button.addEventListener(
          "click",
          () => {

            if (
              state.actionLocked
            ) {

              return;

            }


            container
              .querySelectorAll(
                ".target-btn"
              )
              .forEach(
                btn =>
                  btn.classList.remove(
                    "selected"
                  )
              );


            button.classList.add(
              "selected"
            );


            state.selectedTarget =
              button.dataset.targetId;


            $("confirmActionBtn")
              ?.classList.remove(
                "hidden"
              );

          }
        );

      }
    );


  if (
    allowSkip
  ) {

    $("skipActionBtn")
      ?.classList.remove(
        "hidden"
      );

  }

}


/* =========================================================
   WEREWOLF
   ========================================================= */

function setupWolfAction(
  player
) {

  $("actionIcon").textContent =
    "🔪";

  $("actionTitle").textContent =
    "اختر ضحيتكم";

  $("actionDescription").textContent =
    "اختر لاعبًا لاستهدافه. سيتم احتساب اختيارات جميع القتلة.";


  const targets =
    alivePlayers().filter(
      target =>
        target.id !==
        player.id
    );


  renderTargets(
    targets,
    true
  );


  state.currentAction =
    "wolf";

}


/* =========================================================
   DOCTOR
   ========================================================= */

function setupDoctorAction(
  player
) {

  $("actionIcon").textContent =
    "👨‍⚕️";

  $("actionTitle").textContent =
    "اختر من تحمي";

  $("actionDescription").textContent =
    "يمكنك حماية لاعب واحد من هجوم القتلة.";


  renderTargets(
    alivePlayers(),
    true
  );


  state.currentAction =
    "doctor";

}


/* =========================================================
   SEER
   ========================================================= */

function setupSeerAction(
  player
) {

  $("actionIcon").textContent =
    "🔮";

  $("actionTitle").textContent =
    "اكشف فريق لاعب";

  $("actionDescription").textContent =
    "ستظهر لك نتيجة اللاعب الذي تختاره فقط.";


  const targets =
    alivePlayers().filter(
      target =>
        target.id !==
        player.id
    );


  renderTargets(
    targets,
    true
  );


  state.currentAction =
    "seer";

}


/* =========================================================
   WITCH
   ========================================================= */

function setupWitchAction(
  player
) {

  $("actionIcon").textContent =
    "🧙";

  $("actionTitle").textContent =
    "قدرات الساحر";

  $("actionDescription").textContent =
    "كل ساحر لديه إكسير وسم مستقلان عن بقية السحرة.";


  const witch =
    state.witchStates[
      player.id
    ];


  if (!witch) {

    state.witchStates[
      player.id
    ] = {

      healUsed:
        false,

      poisonUsed:
        false

    };

  }


  const currentWitch =
    state.witchStates[
      player.id
    ];


  const container =
    $("actionTargets");

  if (!container) return;


  container.innerHTML =
    "";


  const healButton =
    document.createElement(
      "button"
    );


  healButton.className =
    "target-btn";

  healButton.type =
    "button";


  healButton.innerHTML = `

    <span>
      ❤️ إكسير الشفاء
    </span>

    <span>
      ${
        currentWitch.healUsed
          ? "مستخدم"
          : "متاح"
      }
    </span>

  `;


  if (
    currentWitch.healUsed
  ) {

    healButton.classList.add(
      "dead"
    );

  } else {

    healButton.addEventListener(
      "click",
      () => {

        if (
          state.actionLocked
        ) {

          return;

        }


        state.selectedTarget =
          null;

        state.currentAction =
          "witch-heal";


        container
          .querySelectorAll(
            ".target-btn"
          )
          .forEach(
            btn =>
              btn.classList.remove(
                "selected"
              )
          );


        healButton.classList.add(
          "selected"
        );


        $("confirmActionBtn")
          ?.classList.remove(
            "hidden"
          );

      }
    );

  }


  const poisonButton =
    document.createElement(
      "button"
    );


  poisonButton.className =
    "target-btn";

  poisonButton.type =
    "button";


  poisonButton.innerHTML = `

    <span>
      ☠️ السم
    </span>

    <span>
      ${
        currentWitch.poisonUsed
          ? "مستخدم"
          : "متاح"
      }
    </span>

  `;


  if (
    currentWitch.poisonUsed
  ) {

    poisonButton.classList.add(
      "dead"
    );

  } else {

    poisonButton.addEventListener(
      "click",
      () => {

        if (
          state.actionLocked
        ) {

          return;

        }


        state.currentAction =
          "witch-poison";

        state.selectedTarget =
          null;


        container.innerHTML = `

          <div
            class="hint"
            style="text-align:center;"
          >
            اختر اللاعب الذي تريد تسميمه:
          </div>

        `;


        renderTargets(
          alivePlayers().filter(
            target =>
              target.id !==
              player.id
          ),
          false
        );

      }
    );

  }


  container.appendChild(
    healButton
  );

  container.appendChild(
    poisonButton
  );


  $("skipActionBtn")
    ?.classList.remove(
      "hidden"
    );


  state.currentAction =
    "witch";

}


/* =========================================================
   HUNTER NIGHT
   ========================================================= */

function setupHunterNightAction() {

  $("actionIcon").textContent =
    "🏹";

  $("actionTitle").textContent =
    "ليست لديك حركة ليلية";

  $("actionDescription").textContent =
    "انتظر حتى يأتي دورك في حالة موتك.";


  $("skipActionBtn")
    ?.classList.remove(
      "hidden"
    );


  state.currentAction =
    "skip";

}


/* =========================================================
   VILLAGER
   ========================================================= */

function setupVillagerAction() {

  $("actionIcon").textContent =
    "👨‍🌾";

  $("actionTitle").textContent =
    "لا توجد قدرة";

  $("actionDescription").textContent =
    "أنت قروي. لا توجد لديك حركة ليلية.";


  $("skipActionBtn")
    ?.classList.remove(
      "hidden"
    );


  state.currentAction =
    "skip";

}


/* =========================================================
   CONFIRM ACTION
   ========================================================= */

function confirmAction() {

  if (
    state.actionLocked
  ) {

    return;

  }


  const player =
    state.currentPlayer;

  if (!player) return;


  state.actionLocked =
    true;


  $("confirmActionBtn")
    ?.setAttribute(
      "disabled",
      "disabled"
    );


  switch (
    state.currentAction
  ) {

    case "wolf": {

      if (
        !state.selectedTarget
      ) {

        state.actionLocked =
          false;

        $("confirmActionBtn")
          ?.removeAttribute(
            "disabled"
          );

        showToast(
          "اختر هدفًا أولًا",
          "error"
        );

        return;

      }


      state.wolfChoices[
        player.id
      ] =
        state.selectedTarget;


      finishNightTurn();

      break;

    }


    case "doctor": {

      state.doctorTarget =
        state.selectedTarget ||
        null;


      finishNightTurn();

      break;

    }


    case "seer": {

      if (
        !state.selectedTarget
      ) {

        state.actionLocked =
          false;

        $("confirmActionBtn")
          ?.removeAttribute(
            "disabled"
          );

        showToast(
          "اختر لاعبًا أولًا",
          "error"
        );

        return;

      }


      state.seerTarget =
        state.selectedTarget;


      const target =
        getPlayer(
          state.selectedTarget
        );


      const targetRole =
        getRole(target);


      showModal(

        "نتيجة الكشف",

        `${target.name} ينتمي إلى ${
          targetRole.team ===
          "wolves"
            ? "فريق القتلة 🔪"
            : "فريق القرية 🏘️"
        }`,

        "🔮",

        () => {

          $("confirmActionBtn")
            ?.removeAttribute(
              "disabled"
            );

          finishNightTurn();

        }

      );

      break;

    }


    case "witch-heal": {

      const witch =
        state.witchStates[
          player.id
        ];


      if (
        !witch ||
        witch.healUsed
      ) {

        state.actionLocked =
          false;

        $("confirmActionBtn")
          ?.removeAttribute(
            "disabled"
          );

        showToast(
          "إكسير الشفاء مستخدم مسبقًا",
          "error"
        );

        return;

      }


      witch.healUsed =
        true;


      if (
        !state.nightProtectedPlayers
          .includes(
            player.id
          )
      ) {

        state.nightProtectedPlayers
          .push(
            player.id
          );

      }


      showToast(
        "تم استخدام إكسير الشفاء",
        "success"
      );


      finishNightTurn();

      break;

    }


    case "witch-poison": {

      const witch =
        state.witchStates[
          player.id
        ];


      if (
        !witch ||
        witch.poisonUsed
      ) {

        state.actionLocked =
          false;

        $("confirmActionBtn")
          ?.removeAttribute(
            "disabled"
          );

        showToast(
          "السم مستخدم مسبقًا",
          "error"
        );

        return;

      }


      if (
        !state.selectedTarget
      ) {

        state.actionLocked =
          false;

        $("confirmActionBtn")
          ?.removeAttribute(
            "disabled"
          );

        showToast(
          "اختر لاعبًا لتسميمه",
          "error"
        );

        return;

      }


      witch.poisonUsed =
        true;


      if (
        !state.nightPoisonTargets
          .includes(
            state.selectedTarget
          )
      ) {

        state.nightPoisonTargets
          .push(
            state.selectedTarget
          );

      }


      showToast(
        "تم استخدام السم",
        "success"
      );


      finishNightTurn();

      break;

    }


    default:

      finishNightTurn();

      break;

  }

}


/* =========================================================
   SKIP ACTION
   ========================================================= */

function skipAction() {

  if (
    state.actionLocked
  ) {

    return;

  }


  state.actionLocked =
    true;


  $("skipActionBtn")
    ?.setAttribute(
      "disabled",
      "disabled"
    );


  finishNightTurn();

}


/* =========================================================
   FINISH NIGHT TURN
   ========================================================= */

function finishNightTurn() {

  if (
    state.nightResolved
  ) {

    return;

  }


  state.nightIndex++;


  $("confirmActionBtn")
    ?.removeAttribute(
      "disabled"
    );

  $("skipActionBtn")
    ?.removeAttribute(
      "disabled"
    );


  if (
    state.nightIndex >=
    state.nightOrder.length
  ) {

    resolveNight();

    return;

  }


  let nextPlayer =
    state.nightOrder[
      state.nightIndex
    ];


  while (
    nextPlayer &&
    !getPlayer(
      nextPlayer.id
    )?.alive
  ) {

    state.nightIndex++;

    nextPlayer =
      state.nightOrder[
        state.nightIndex
      ];

  }


  if (!nextPlayer) {

    resolveNight();

    return;

  }


  showPassScreen(
    nextPlayer,
    "night"
  );

}


/* =========================================================
   PASS SCREEN
   ========================================================= */

function showPassScreen(
  playerOrName,
  mode
) {

  state.passMode =
    mode;


  let player =
    playerOrName;


  if (
    typeof playerOrName ===
    "string"
  ) {

    player =
      state.players.find(
        p =>
          p.name ===
          playerOrName
      );

  }


  if (player) {

    state.currentPlayer =
      player;


    if (
      $("passPlayerName")
    ) {

      $("passPlayerName")
        .textContent =
        player.name;

    }


    setAvatarElement(
      $("passPlayerAvatar"),
      player
    );

  } else {

    if (
      $("passPlayerName")
    ) {

      $("passPlayerName")
        .textContent =
        playerOrName;

    }

  }


  showScreen(
    "passScreen"
  );

}


function continuePass() {

  if (
    state.passMode ===
    "night"
  ) {

    state.actionLocked =
      false;

    showNextNightPlayer();

    return;

  }


  if (
    state.passMode ===
    "voting"
  ) {

    state.voteLocked =
      false;

    showNextVoter();

    return;

  }

}


/* =========================================================
   RESOLVE NIGHT
   ========================================================= */

function resolveNight() {

  if (
    state.nightResolved
  ) {

    return;

  }


  state.nightResolved =
    true;


  const deaths =
    new Set();


  /*
   * هجوم القتلة
   */

  const wolfVotes =
    Object.values(
      state.wolfChoices
    );


  if (
    wolfVotes.length > 0
  ) {

    const counts =
      {};


    wolfVotes.forEach(
      targetId => {

        if (
          !getPlayer(
            targetId
          )?.alive
        ) {

          return;

        }


        counts[targetId] =
          (
            counts[targetId] ||
            0
          ) + 1;

      }
    );


    const values =
      Object.values(
        counts
      );


    if (
      values.length > 0
    ) {

      const highest =
        Math.max(
          ...values
        );


      const winners =
        Object.keys(
          counts
        ).filter(
          id =>
            counts[id] ===
            highest
        );


      if (
        winners.length ===
        1
      ) {

        deaths.add(
          winners[0]
        );

      }

    }

  }


  /*
   * حماية الطبيب
   */

  if (
    state.doctorTarget &&
    deaths.has(
      state.doctorTarget
    )
  ) {

    deaths.delete(
      state.doctorTarget
    );

  }


  /*
   * سم السحرة
   */

  state.nightPoisonTargets
    .forEach(
      id => {

        const target =
          getPlayer(id);

        if (
          target?.alive
        ) {

          deaths.add(
            id
          );

        }

      }
    );


  /*
   * إكسير الشفاء
   */

  state.nightProtectedPlayers
    .forEach(
      id => {

        deaths.delete(
          id
        );

      }
    );


  state.nightDeaths =
    [...deaths];


  const hunterDeaths =
    [];


  state.nightDeaths.forEach(
    id => {

      const player =
        getPlayer(id);


      if (
        !player ||
        !player.alive
      ) {

        return;

      }


      player.alive =
        false;


      if (
        player.role ===
        "hunter"
      ) {

        hunterDeaths.push(
          player
        );

      }

    }
  );


  if (
    hunterDeaths.length > 0
  ) {

    state.hunterQueue =
      hunterDeaths;

    state.hunterMode =
      "night";

    startNextHunterTurn();

    return;

  }


  finishNightResult();

}


/* =========================================================
   HUNTER
   ========================================================= */

function startNextHunterTurn() {

  if (
    state.hunterQueue.length ===
    0
  ) {

    if (
      state.hunterMode ===
      "night"
    ) {

      finishNightResult();

    } else {

      finishVoteResult();

    }

    return;

  }


  const hunter =
    state.hunterQueue.shift();


  if (!hunter) {

    startNextHunterTurn();

    return;

  }


  state.currentPlayer =
    hunter;

  state.selectedTarget =
    null;

  state.actionLocked =
    false;


  $("actionPlayerName")
    .textContent =
    hunter.name;

  $("actionIcon")
    .textContent =
    "🏹";

  $("actionTitle")
    .textContent =
    "اختر لاعبًا";

  $("actionDescription")
    .textContent =
    "لقد خرجت من اللعبة. يمكنك إسقاط لاعب آخر معك.";


  $("confirmActionBtn")
    ?.classList.add(
      "hidden"
    );


  $("skipActionBtn")
    ?.classList.remove(
      "hidden"
    );


  $("skipActionBtn")
    ?.removeAttribute(
      "disabled"
    );


  updatePlayerAvatars();


  renderTargets(

    alivePlayers().filter(
      player =>
        player.id !==
        hunter.id
    ),

    true

  );


  state.currentAction =
    "hunter";


  showScreen(
    "actionScreen"
  );

}


function handleHunterConfirm() {

  if (
    state.actionLocked
  ) {

    return;

  }


  const hunter =
    state.currentPlayer;

  if (!hunter) return;


  if (
    !state.selectedTarget
  ) {

    showToast(
      "اختر لاعبًا أولًا",
      "error"
    );

    return;

  }


  state.actionLocked =
    true;


  const target =
    getPlayer(
      state.selectedTarget
    );


  if (
    target &&
    target.alive
  ) {

    target.alive =
      false;


    if (
      target.role ===
      "hunter"
    ) {

      state.hunterQueue.push(
        target
      );

    }


    if (
      state.hunterMode ===
      "night" &&
      !state.nightDeaths.includes(
        target.id
      )
    ) {

      state.nightDeaths.push(
        target.id
      );

    }

  }


  state.selectedTarget =
    null;


  $("confirmActionBtn")
    ?.removeAttribute(
      "disabled"
    );


  startNextHunterTurn();

}


/* =========================================================
   HUNTER SKIP
   ========================================================= */

function handleHunterSkip() {

  if (
    state.actionLocked
  ) {

    return;

  }


  state.actionLocked =
    true;


  startNextHunterTurn();

}


/* =========================================================
   NIGHT RESULT
   ========================================================= */

function finishNightResult() {

  const deaths =
    state.nightDeaths
      .map(
        id =>
          getPlayer(id)
      )
      .filter(
        Boolean
      );


  if (
    deaths.length ===
    0
  ) {

    if (
      $("nightResultText")
    ) {

      $("nightResultText")
        .innerHTML = `

          🌙 مرت الليلة بسلام.

          <br>

          لم يمت أي لاعب.

        `;

    }

  } else {

    if (
      $("nightResultText")
    ) {

      $("nightResultText")
        .innerHTML = `

          مات هذه الليلة:

          <br><br>

          ${deaths.map(
            player =>
              `

                <strong>
                  💀 ${escapeHTML(
                    player.name
                  )}
                </strong>

              `
          ).join("<br>")}

        `;

    }

  }


  showScreen(
    "nightResultScreen"
  );


  if (
    checkWinner()
  ) {

    return;

  }

}


/* =========================================================
   DISCUSSION
   ========================================================= */

function startDiscussion() {

  clearInterval(
    state.discussionInterval
  );


  state.discussionSeconds =
    120;


  updateTimer();


  /*
   * showScreen يشغل 6.mp3
   */

  showScreen(
    "discussionScreen"
  );


  state.discussionInterval =
    setInterval(
      () => {

        state.discussionSeconds--;

        updateTimer();


        if (
          state.discussionSeconds <=
          0
        ) {

          clearInterval(
            state.discussionInterval
          );

          state.discussionInterval =
            null;


          showToast(
            "انتهى وقت النقاش",
            "error"
          );


          /*
           * startVoting -> showScreen
           * ويوقف 6.mp3 تلقائيًا
           */

          startVoting();

        }

      },
      1000
    );

}


function updateTimer() {

  const min =
    Math.floor(
      state.discussionSeconds /
      60
    )
      .toString()
      .padStart(
        2,
        "0"
      );


  const sec =
    (
      state.discussionSeconds %
      60
    )
      .toString()
      .padStart(
        2,
        "0"
      );


  if (
    $("timer")
  ) {

    $("timer").textContent =
      `${min}:${sec}`;

  }

}


/* =========================================================
   VOTING
   ========================================================= */

function startVoting() {

  if (
    state.votingResolved
  ) {

    return;

  }


  clearInterval(
    state.discussionInterval
  );

  state.discussionInterval =
    null;


  state.votingOrder =
    [...alivePlayers()]
      .sort(
        (a, b) =>
          a.name.localeCompare(
            b.name,
            "ar"
          )
      );


  state.votingIndex =
    0;

  state.votes =
    {};

  state.selectedVote =
    null;

  state.votingResolved =
    false;

  state.voteLocked =
    false;


  showNextVoter();

}


/* =========================================================
   NEXT VOTER
   ========================================================= */

function showNextVoter() {

  if (
    state.votingResolved
  ) {

    return;

  }


  while (
    state.votingIndex <
      state.votingOrder.length
  ) {

    const voter =
      state.votingOrder[
        state.votingIndex
      ];


    if (
      voter &&
      getPlayer(
        voter.id
      )?.alive
    ) {

      break;

    }


    state.votingIndex++;

  }


  if (
    state.votingIndex >=
    state.votingOrder.length
  ) {

    resolveVotes();

    return;

  }


  const voter =
    state.votingOrder[
      state.votingIndex
    ];


  state.currentPlayer =
    voter;

  state.selectedVote =
    null;

  state.voteLocked =
    false;


  $("votingPlayerName")
    .textContent =
    voter.name;


  setAvatarElement(
    $("votingPlayerAvatar"),
    voter
  );


  renderVotingTargets(
    voter
  );


  $("confirmVoteBtn")
    ?.classList.add(
      "hidden"
    );


  $("confirmVoteBtn")
    ?.removeAttribute(
      "disabled"
    );


  showScreen(
    "votingScreen"
  );

}


/* =========================================================
   VOTING TARGETS
   ========================================================= */

function renderVotingTargets(
  voter
) {

  const container =
    $("votingTargets");

  if (!container) return;


  const targets =
    alivePlayers().filter(
      player =>
        player.id !==
        voter.id
    );


  container.innerHTML =
    targets.map(
      player => `

        <button
          class="target-btn"
          data-vote-id="${player.id}"
          type="button"
        >

          <span class="target-player-info">

            ${
              player.avatar
                ? `

                  <img
                    src="${escapeHTML(
                      player.avatar
                    )}"
                    alt=""
                    class="target-avatar"
                  >

                `
                : `

                  <span class="target-avatar target-avatar-empty">
                    👤
                  </span>

                `
            }

            <span>
              ${escapeHTML(
                player.name
              )}
            </span>

          </span>

          <span>
            🗳️
          </span>

        </button>

      `
    ).join("");


  const skip =
    document.createElement(
      "button"
    );


  skip.className =
    "target-btn";

  skip.type =
    "button";

  skip.dataset.voteId =
    "SKIP";


  skip.innerHTML = `

    <span>
      ⏭️ تخطي التصويت
    </span>

    <span>
      —
    </span>

  `;


  container.appendChild(
    skip
  );


  container
    .querySelectorAll(
      ".target-btn"
    )
    .forEach(
      button => {

        button.addEventListener(
          "click",
          () => {

            if (
              state.voteLocked
            ) {

              return;

            }


            container
              .querySelectorAll(
                ".target-btn"
              )
              .forEach(
                btn =>
                  btn.classList.remove(
                    "selected"
                  )
              );


            button.classList.add(
              "selected"
            );


            state.selectedVote =
              button.dataset.voteId;


            $("confirmVoteBtn")
              ?.classList.remove(
                "hidden"
              );

          }
        );

      }
    );

}


/* =========================================================
   CONFIRM VOTE
   ========================================================= */

function confirmVote() {

  if (
    state.voteLocked
  ) {

    return;

  }


  if (
    state.votingResolved
  ) {

    return;

  }


  if (
    !state.selectedVote
  ) {

    showToast(
      "اختر تصويتك أولًا",
      "error"
    );

    return;

  }


  const voter =
    state.currentPlayer;


  if (
    !voter ||
    !voter.alive
  ) {

    return;

  }


  /*
   * قفل فوري
   */

  state.voteLocked =
    true;


  $("confirmVoteBtn")
    ?.setAttribute(
      "disabled",
      "disabled"
    );


  /*
   * منع نفس اللاعب من التصويت مرتين
   */

  if (
    Object.prototype
      .hasOwnProperty.call(
        state.votes,
        voter.id
      )
  ) {

    return;

  }


  state.votes[
    voter.id
  ] =
    state.selectedVote;


  /*
   * صوت التصويت
   */

  audioSystem
    .playVotingSound();


  state.votingIndex++;


  state.selectedVote =
    null;


  /*
   * إذا انتهى التصويت
   */

  if (
    state.votingIndex >=
    state.votingOrder.length
  ) {

    resolveVotes();

    return;

  }


  /*
   * اللاعب التالي
   */

  const nextVoter =
    state.votingOrder[
      state.votingIndex
    ];


  if (
    !nextVoter ||
    !nextVoter.alive
  ) {

    showNextVoter();

    return;

  }


  showPassScreen(
    nextVoter,
    "voting"
  );

}


/* =========================================================
   RESOLVE VOTES
   ========================================================= */

function resolveVotes() {

  if (
    state.votingResolved
  ) {

    return;

  }


  /*
   * قفل نهائي
   */

  state.votingResolved =
    true;

  state.voteLocked =
    true;


  const counts =
    {};


  Object.values(
    state.votes
  ).forEach(
    vote => {

      if (
        vote ===
        "SKIP"
      ) {

        return;

      }


      const target =
        getPlayer(
          vote
        );


      if (
        !target ||
        !target.alive
      ) {

        return;

      }


      counts[vote] =
        (
          counts[vote] ||
          0
        ) + 1;

    }
  );


  const skipCount =
    Object.values(
      state.votes
    ).filter(
      vote =>
        vote ===
        "SKIP"
    ).length;


  const candidates =
    Object.entries(
      counts
    );


  let eliminatedId =
    null;


  if (
    candidates.length >
    0
  ) {

    const highest =
      Math.max(
        ...candidates.map(
          ([_, count]) =>
            count
        ),
        skipCount
      );


    const winners =
      candidates
        .filter(
          ([_, count]) =>
            count ===
            highest
        )
        .map(
          ([id]) =>
            id
        );


    if (
      skipCount ===
      highest
    ) {

      winners.push(
        "SKIP"
      );

    }


    if (
      winners.length ===
      1 &&
      winners[0] !==
      "SKIP"
    ) {

      eliminatedId =
        winners[0];

    }

  } else if (
    skipCount > 0
  ) {

    eliminatedId =
      null;

  }


  /*
   * لا يوجد خروج
   */

  if (
    !eliminatedId
  ) {

    if (
      $("voteResultText")
    ) {

      $("voteResultText")
        .innerHTML = `

          ⚖️ لم يتم إخراج أي لاعب.

          <br><br>

          حدث تعادل أو حصل التخطي
          على أعلى عدد من الأصوات.

        `;

    }


    showScreen(
      "voteResultScreen"
    );

    return;

  }


  const eliminated =
    getPlayer(
      eliminatedId
    );


  if (
    !eliminated ||
    !eliminated.alive
  ) {

    showScreen(
      "voteResultScreen"
    );

    return;

  }


  eliminated.alive =
    false;


  /*
   * الصياد
   */

  if (
    eliminated.role ===
    "hunter"
  ) {

    if (
      $("voteResultText")
    ) {

      $("voteResultText")
        .innerHTML = `

          💀 خرج

          <strong>
            ${escapeHTML(
              eliminated.name
            )}
          </strong>

          من اللعبة.

          <br><br>

          لكنه صياد، لذلك لديه فرصة أخيرة.

        `;

    }


    state.hunterQueue =
      [eliminated];

    state.hunterMode =
      "vote";


    showScreen(
      "voteResultScreen"
    );

    return;

  }


  const role =
    getRole(
      eliminated
    );


  if (
    $("voteResultText")
  ) {

    $("voteResultText")
      .innerHTML = `

        💀 خرج من اللعبة:

        <br><br>

        <strong>
          ${escapeHTML(
            eliminated.name
          )}
        </strong>

        <br><br>

        دوره كان:

        ${role.icon}
        ${role.name}

      `;

  }


  showScreen(
    "voteResultScreen"
  );

}


/* =========================================================
   CONTINUE AFTER VOTE
   ========================================================= */

function continueAfterVote() {

  /*
   * مهم:
   * لا نستخدم document.querySelectorAll("audio")
   * هنا لأن showScreen هو المسؤول عن موسيقى الواجهات.
   *
   * وأيضًا لا نستدعي دالة غير موجودة.
   */


  /*
   * 🏹 صياد التصويت
   */

  if (
    state.hunterMode ===
      "vote" &&
    state.hunterQueue.length >
      0
  ) {

    state.actionLocked =
      false;

    startNextHunterTurn();

    return;

  }


  /*
   * 🏆 الفائز
   */

  if (
    checkWinner()
  ) {

    return;

  }


  /*
   * 🌙 ليلة جديدة
   */

  state.hunterMode =
    null;

  state.hunterQueue =
    [];

  state.voteLocked =
    false;

  state.actionLocked =
    false;

  state.votingResolved =
    false;

  state.night++;

  beginNight();

}


/* =========================================================
   FINISH VOTE RESULT
   ========================================================= */

function finishVoteResult() {

  state.hunterMode =
    null;


  if (
    checkWinner()
  ) {

    return;

  }


  if (
    $("voteResultText")
  ) {

    $("voteResultText")
      .innerHTML += `

        <br><br>
        انتهى التصويت.

      `;

  }


  showScreen(
    "voteResultScreen"
  );

}


/* =========================================================
   WINNER CHECK
   ========================================================= */

function checkWinner() {

  const wolves =
    getAliveWolves().length;

  const villagers =
    getAliveVillagers().length;


  if (
    wolves === 0
  ) {

    showWinner(

      "القرية",

      "🏘️",

      "فاز فريق القرية!"

    );

    return true;

  }


  if (
    wolves >=
    villagers
  ) {

    showWinner(

      "المرتزقة",

      "🔪",

      "فاز فريق المرتزقة!"

    );

    return true;

  }


  return false;

}


/* =========================================================
   WINNER SCREEN
   ========================================================= */

function showWinner(
  team,
  icon,
  description
) {

  clearInterval(
    state.discussionInterval
  );

  state.discussionInterval =
    null;


  /*
   * بيانات الشاشة
   */

  if (
    $("winnerIcon")
  ) {

    $("winnerIcon")
      .textContent =
      icon;

  }


  if (
    $("winnerTitle")
  ) {

    $("winnerTitle")
      .textContent =
      team ===
      "المرتزقة"
        ? "فوز المرتزقة"
        : "فوز القرية";

  }


  if (
    $("winnerDescription")
  ) {

    $("winnerDescription")
      .textContent =
      description;

  }


  /*
   * مهم جدًا:
   *
   * showScreen أولًا حتى يوقف
   * الموسيقى الرئيسية والنقاش.
   */

  showScreen(
    "winnerScreen"
  );


  /*
   * الآن نشغل موسيقى الفوز.
   */

  if (
    audioSystem.isUserMuted
  ) {

    return;

  }


  const villageMusic =
    getVillageWinMusic();

  const mercenariesMusic =
    getMercenariesWinMusic();


  if (
    team ===
    "المرتزقة"
  ) {

    mercenariesMusic.currentTime =
      0;

    mercenariesMusic.volume =
      0.8;

    mercenariesMusic.loop =
      false;

    mercenariesMusic.play()
      .catch(() => {});

  }


  else if (
    team ===
    "القرية"
  ) {

    villageMusic.currentTime =
      0;

    villageMusic.volume =
      0.8;

    villageMusic.loop =
      false;

    villageMusic.play()
      .catch(() => {});

  }

}


/* =========================================================
   NEW GAME
   ========================================================= */

function newGame() {

  resetGameData();


  state.activeRoles = {

    werewolf:
      true,

    doctor:
      true,

    seer:
      true,

    witch:
      true,

    hunter:
      true,

    villager:
      false

  };


  state.distributionMode =
    "random";


  renderPlayerList();

  renderRoleOptions();

  updateRoleSummary();


  setDistributionMode(
    "random"
  );


  showScreen(
    "playersScreen"
  );

}


/* =========================================================
   RULES
   ========================================================= */

function showRules() {

  showModal(

    "طريقة اللعب",

    "أولًا أضف اللاعبين والصور. بعدها اختر الأدوار التي تريدها واختر بين التوزيع العشوائي أو اليدوي. في التوزيع العشوائي يمكن أن تتكرر الأدوار، والقروي ليس مضمونًا. في التوزيع اليدوي تختار دور كل لاعب بنفسك. بعد بدء اللعبة سيكشف كل لاعب دوره بشكل سري، ثم تبدأ أدوار الليل والنقاش والتصويت حتى يفوز أحد الفريقين.",

    "📖"

  );

}


/* =========================================================
   SETTINGS
   ========================================================= */

function showSettings() {

  showModal(

    "الإعدادات",

    "واجهة اللعبة تستخدم تنبيهات داخلية بدل نوافذ المتصفح، والتصميم مخصص للهاتف والكمبيوتر. صور اللاعبين تبقى داخل جلسة اللعبة الحالية.",

    "⚙️"

  );

}


/* =========================================================
   EVENTS
   ========================================================= */

function bindEvents() {

  $("startBtn")
    ?.addEventListener(
      "click",
      () => {

        showScreen(
          "playersScreen"
        );

      }
    );


  $("rulesBtn")
    ?.addEventListener(
      "click",
      showRules
    );


  $("settingsBtn")
    ?.addEventListener(
      "click",
      showSettings
    );


  $("backHomeBtn")
    ?.addEventListener(
      "click",
      () => {

        showScreen(
          "homeScreen"
        );

      }
    );


  $("addPlayerBtn")
    ?.addEventListener(
      "click",
      addPlayer
    );


  $("playerNameInput")
    ?.addEventListener(
      "keydown",
      event => {

        if (
          event.key ===
          "Enter"
        ) {

          event.preventDefault();

          addPlayer();

        }

      }
    );


  /*
   * DISTRIBUTION
   */

  $("randomRoleModeBtn")
    ?.addEventListener(
      "click",
      () => {

        setDistributionMode(
          "random"
        );

      }
    );


  $("manualRoleModeBtn")
    ?.addEventListener(
      "click",
      () => {

        setDistributionMode(
          "manual"
        );

      }
    );


  /*
   * HOME BUTTONS
   */

  $("gameHomeBtn")
    ?.addEventListener(
      "click",
      () => {

        confirmExitGame(
          "home"
        );

      }
    );


  $("gameHomeBtnAction")
    ?.addEventListener(
      "click",
      () => {

        confirmExitGame(
          "home"
        );

      }
    );


  $("gameHomeBtnVoting")
    ?.addEventListener(
      "click",
      () => {

        confirmExitGame(
          "home"
        );

      }
    );


  /*
   * TO ROLES
   */

  $("toRolesBtn")
    ?.addEventListener(
      "click",
      () => {

        if (
          state.players.length <
          3
        ) {

          showToast(
            "تحتاج إلى 3 لاعبين على الأقل",
            "error"
          );

          return;

        }


        updateRoleSummary();


        showScreen(
          "rolesSetupScreen"
        );

      }
    );


  /*
   * BACK PLAYERS
   */

  $("backPlayersBtn")
    ?.addEventListener(
      "click",
      () => {

        showScreen(
          "playersScreen"
        );

      }
    );


  /*
   * ROLE OPTIONS
   */

  $("roleOptions")
    ?.addEventListener(
      "click",
      event => {

        const button =
          event.target.closest(
            ".role-option"
          );

        if (!button) return;


        toggleRole(
          button.dataset.role
        );

      }
    );


  /*
   * REVIEW
   */

  $("toReviewBtn")
    ?.addEventListener(
      "click",
      prepareReview
    );


  $("backRolesBtn")
    ?.addEventListener(
      "click",
      () => {

        showScreen(
          "rolesSetupScreen"
        );

      }
    );


  /*
   * START
   */

  $("startGameBtn")
    ?.addEventListener(
      "click",
      startGame
    );


  /*
   * ROLE
   */

  $("revealRoleBtn")
    ?.addEventListener(
      "click",
      revealRole
    );


  $("continueRoleBtn")
    ?.addEventListener(
      "click",
      continueRole
    );


  /*
   * PASS
   */

  $("continuePassBtn")
    ?.addEventListener(
      "click",
      continuePass
    );


  /*
   * ACTION
   */

  $("confirmActionBtn")
    ?.addEventListener(
      "click",
      () => {

        if (
          state.currentAction ===
          "hunter"
        ) {

          handleHunterConfirm();

          return;

        }


        confirmAction();

      }
    );


  $("skipActionBtn")
    ?.addEventListener(
      "click",
      () => {

        if (
          state.currentAction ===
          "hunter"
        ) {

          handleHunterSkip();

          return;

        }


        skipAction();

      }
    );


  /*
   * DISCUSSION
   */

  $("startDiscussionBtn")
    ?.addEventListener(
      "click",
      startDiscussion
    );


  /*
   * VOTING
   */

  $("startVotingBtn")
    ?.addEventListener(
      "click",
      startVoting
    );


  $("confirmVoteBtn")
    ?.addEventListener(
      "click",
      confirmVote
    );


  /*
   * NEXT AFTER VOTE
   */

  $("continueAfterVoteBtn")
    ?.addEventListener(
      "click",
      continueAfterVote
    );


  /*
   * NEW GAME
   */

  $("newGameBtn")
    ?.addEventListener(
      "click",
      newGame
    );


  /*
   * MODAL
   */

  $("closeModalBtn")
    ?.addEventListener(
      "click",
      () =>
        closeModal(false)
    );


  $("modalOkBtn")
    ?.addEventListener(
      "click",
      () =>
        closeModal(true)
    );


  $("modal")
    ?.addEventListener(
      "click",
      event => {

        if (
          event.target ===
          $("modal")
        ) {

          closeModal(false);

        }

      }
    );


  /*
   * ESCAPE
   */

  document.addEventListener(
    "keydown",
    event => {

      if (
        event.key ===
        "Escape" &&
        !$("modal")
          ?.classList.contains(
            "hidden"
          )
      ) {

        closeModal(false);

      }

    }
  );


  /*
   * AVATAR
   */

  $("avatarInput")
    ?.addEventListener(
      "change",
      handleAvatarUpload
    );

}


/* =========================================================
   INITIALIZATION
   ========================================================= */

function initGame() {

  /*
   * تهيئة الصوت القصير
   */

  audioSystem.init();


  bindEvents();


  renderPlayerList();

  renderRoleOptions();

  updateRoleSummary();


  setDistributionMode(
    "random"
  );


  /*
   * تجهيز عناصر الصوت
   */

  getBgMusic();
  getDiscussionMusic();
  getVillageWinMusic();
  getMercenariesWinMusic();


  setTimeout(
    () => {

      showScreen(
        "homeScreen"
      );

    },
    100
  );

}


/* =========================================================
   START
   ========================================================= */

if (
  document.readyState ===
  "loading"
) {

  document.addEventListener(
    "DOMContentLoaded",
    initGame
  );

} else {

  initGame();

}