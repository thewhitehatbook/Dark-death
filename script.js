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

  samurai: {
    name: "الساموراي",
    icon: "⚔️",
    team: "village",
    teamName: "القرية",
    description:
      "محارب شريف يحمي أهل القرية. إذا حاول المرتزقة قتله ليلًا، ينجو من الهجوم مرة واحدة. وإذا أُخرج بالتصويت، يستطيع اختيار لاعب لمبارزته."
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
      "اكشف دور لاعب واحد بالكامل، ثم استخدم المعلومة لمساعدة القرية."
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
      "إذا خرجت بالتصويت، يمكنك اختيار لاعب ليخرج معك."
  },

  phoenix: {
    name: "العنقاء",
    icon: "🦅",
    team: "village",
    teamName: "فريق القرية",
    description:
      "إذا مت، تعود إلى الحياة بعد انتهاء التصويت مرة واحدة فقط. إذا مت بعد عودتك، تخرج من اللعبة نهائيًا."
  },

  philosopher: {
    name: "الفيلسوف",
    icon: "🧠",
    team: "village",
    teamName: "فريق القرية",
    description:
      "يجب أن تزور اللاعب نفسه مرتين في ليلتين مختلفتين. في الزيارة الثانية تعرف دوره وقدرته وما فعله في الليلة السابقة."
  },

  trapper: {
    name: "ناصب الفخاخ",
    icon: "🕶️",
    team: "village",
    teamName: "فريق القرية",
    description:
      "ضع فخًا على لاعب لليلة واحدة. إذا هاجمه القاتل، يموت القاتل وينجو اللاعب. يمكنك استخدام الفخ مرتين طوال اللعبة."
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
    silent: false,
    samurai: false,
    doctor: true,
    seer: false,
    witch: true,
    hunter: true,
    phoenix: false,
    philosopher: false,
    trapper: false,
    villager: true
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
  samuraiStates: {},
  phoenixStates: {},
  trapperStates: {},
  philosopherStates: {},

  nightActionHistory: {},

  samuraiQueue: [],
  samuraiMode: false,

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
  modalLocked: false,

  started: false,

  manualRoles: {},

  transitionLock: false,

  votingResolved: false,

  nightResolved: false,

  actionLocked: false,

  voteLocked: false,

  isGroupPotionActive: false

};


/* =========================================================
   AUDIO SYSTEM
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


function getPhoenixReviveSound() {

  return getInterfaceAudio(
    "phoenixReviveSound",
    "./7.mp3"
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

  const mercenariesMusic =
    getMercenariesWinMusic();


  [
    bgMusic,
    discussionMusic,
    villageWinMusic,
    mercenariesMusic

  ].forEach(
    audio => {

      if (!audio) return;

      audio.pause();

      try {

        audio.currentTime = 0;

      } catch (error) {}

    }
  );


  const mainScreens = [

    "homeScreen",
    "playersScreen",
    "rolesSetupScreen",
    "reviewScreen",
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
  callback = null,
  lockClose = false
) {

  const modal =
    $("modal");

  if (!modal) {
    return;
  }

  $("modalTitle").textContent =
    title;

  $("modalText").textContent =
    text;

  $("modalIcon").textContent =
    icon;

  state.modalCallback =
    callback;

  state.modalLocked =
    lockClose;

  modal.classList.remove(
    "hidden"
  );

}


function closeModal(
  confirmed = false
) {

  if (
    state.modalLocked &&
    !confirmed
  ) {

    return;

  }


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

  state.modalLocked =
    false;


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

      renderPlayerList();

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

                    <small class="player-sub"></small>

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
      "القاتل دور إجباري",
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


function getWolfCount(count) {

  if (count >= 6 && count <= 8) {
    return 2;
  }

  if (count >= 10 && count <= 13) {
    return 3;
  }

  if (count >= 14 && count <= 17) {
    return 4;
  }

  if (count >= 18 && count <= 21) {
    return 5;
  }

  if (count >= 22 && count <= 25) {
    return 6;
  }

  if (count >= 26 && count <= 29) {
    return 7;
  }

  if (count >= 30 && count <= 33) {
    return 8;
  }

  if (count >= 34 && count <= 37) {
    return 9;
  }

  if (count >= 38 && count <= 41) {
    return 10;
  }

  if (count >= 42 && count <= 45) {
    return 11;
  }

  if (count >= 46 && count <= 50) {
    return 12;
  }

  if (count < 5) {
    return 1;
  }

  return 12;

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


const ROLE_WEIGHTS = {

  werewolf: 100,

  doctor: 70,

  seer: 30,

  witch: 60,

  hunter: 45,

  samurai: 35,

  phoenix: 35,

  philosopher: 20,

  trapper: 20,

  villager: 30

};


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

    let totalWeight =
      0;


    for (
      const role of nonWolfRoles
    ) {

      const weight =
        ROLE_WEIGHTS[role] ??
        1;

      totalWeight +=
        weight;

    }


    let random =
      Math.random() *
      totalWeight;


    let selectedRole =
      nonWolfRoles[
        nonWolfRoles.length - 1
      ];


    for (
      const role of nonWolfRoles
    ) {

      const weight =
        ROLE_WEIGHTS[role] ??
        1;

      random -=
        weight;


      if (
        random <=
        0
      ) {

        selectedRole =
          role;

        break;

      }

    }


    roles.push(
      selectedRole
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

function resetGameData(
  keepPlayers = false
) {

  clearInterval(
    state.discussionInterval
  );

  state.discussionInterval =
    null;

  stopInterfaceMusic();


  if (!keepPlayers) {

    state.players = [];

  } else {

    state.players.forEach(
      player => {

        player.role = null;
        player.alive = true;

      }
    );

  }


  state.night = 1;

  state.nightOrder = [];
  state.nightIndex = 0;

  state.currentPlayer = null;

  state.selectedTarget = null;
  state.currentAction = null;

  state.wolfChoices = {};

  state.doctorTarget = null;
  state.seerTarget = null;

  state.nightPoisonTargets = [];
  state.nightProtectedPlayers = [];
  state.nightDeaths = [];

  state.witchStates = {};
  state.samuraiStates = {};
  state.phoenixStates = {};
  state.trapperStates = {};
  state.philosopherStates = {};

  state.nightActionHistory = {};

  state.samuraiQueue = [];
  state.samuraiMode = false;

  state.passMode = null;

  state.votingOrder = [];
  state.votingIndex = 0;

  state.votes = {};
  state.selectedVote = null;

  state.hunterQueue = [];
  state.hunterMode = null;

  state.modalCallback = null;
  state.modalLocked = false;

  state.transitionLock = false;

  state.votingResolved = false;
  state.nightResolved = false;

  state.actionLocked = false;
  state.voteLocked = false;

  state.discussionSeconds = 120;

  state.started = false;

  state.manualRoles = {};

  state.isGroupPotionActive = false;

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

  state.samuraiStates =
    {};

  state.phoenixStates =
    {};

  state.trapperStates =
    {};

  state.philosopherStates =
    {};

  state.nightActionHistory =
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

  state.isGroupPotionActive =
    false;


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


      if (
        player.role ===
        "samurai"
      ) {

        state.samuraiStates[
          player.id
        ] = {

          nightProtectionUsed:
            false

        };

      }


      if (
        player.role ===
        "phoenix"
      ) {

        state.phoenixStates[
          player.id
        ] = {

          used:
            false,

          pending:
            false

        };

      }


      if (
        player.role ===
        "trapper"
      ) {

        state.trapperStates[
          player.id
        ] = {

          uses:
            0,

          targetId:
            null,

          targetNight:
            null

        };

      }


      if (
        player.role ===
        "philosopher"
      ) {

        state.philosopherStates[
          player.id
        ] = {

          firstTarget:
            null,

          firstNight:
            null

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

  /*
   * الإكسير جماعي لليلة واحدة فقط.
   * لذلك يجب تصفيره مع بداية كل ليلة.
   */

  state.isGroupPotionActive =
    false;


  const alive =
    alivePlayers();


  state.nightOrder =
    [...alive];


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

    case "samurai":

      setupSamuraiAction(
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

    case "phoenix":

      setupPhoenixAction(
        player
      );

      break;

    case "trapper":

      setupTrapperAction(
        player
      );

      break;

    case "philosopher":

      setupPhilosopherAction(
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

function setupWolfAction(
  player
) {

  $("actionIcon").textContent =
    "🔪";

  $("actionTitle").textContent =
    "اختر ضحية";

  $("actionDescription").textContent =
    "اختر لاعبًا لاستهدافه. لا يمكنك تخطي دورك.";


  state.currentAction =
    "wolf";


  const targets =
    alivePlayers().filter(
      target =>
        target.id !== player.id
    );


  renderTargets(
    targets,
    false
  );

}


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
            player => {

              const isWolfFriend =
                state.currentAction ===
                  "wolf" &&
                player.role ===
                  "werewolf";


              return `

                <button
                  class="target-btn ${
                    isWolfFriend
                      ? "wolf-friend"
                      : ""
                  }"
                  data-target-id="${player.id}"
                  type="button"
                  ${
                    isWolfFriend
                      ? "disabled"
                      : ""
                  }
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


                  ${
                    isWolfFriend
                      ? `
                        <span class="wolf-friend-warning">
                           صديقك
                        </span>
                      `
                      : `
                        <span>›</span>
                      `
                  }

                </button>

              `;

            }
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
              state.actionLocked ||
              button.disabled
            ) {

              return;

            }


            const target =
              getPlayer(
                button.dataset.targetId
              );


            if (
              state.currentAction ===
                "wolf" &&
              target &&
              target.role ===
                "werewolf"
            ) {

              showToast(
                "🔴 هذا اللاعب من فريقك! لا يمكنك قتله.",
                "error"
              );

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
    "اختر لاعبًا لتحميه من هجوم القتلة. لا يمكنك تخطي دورك.";


  state.currentAction =
    "doctor";


  renderTargets(
    alivePlayers(),
    false
  );

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
    "اكشف دور لاعب";

  $("actionDescription").textContent =
    "اختر لاعبًا لمعرفة دوره الكامل.";


  state.currentAction =
    "seer";


  const targets =
    alivePlayers().filter(
      target =>
        target.id !== player.id
    );


  renderTargets(
    targets,
    true
  );

}


/* =========================================================
   SAMURAI
   ========================================================= */

function setupSamuraiAction(
  player
) {

  $("actionIcon").textContent =
    "⚔️";

  $("actionTitle").textContent =
    "محارب الساموراي";

  $("actionDescription").textContent =
    "لا تملك قدرة هجومية في الليل. إذا هاجمك المرتزقة، يمكنك النجاة من أول هجوم.";


  $("skipActionBtn")
    ?.classList.remove(
      "hidden"
    );


  state.currentAction =
    "samurai-skip";

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
   PHOENIX
   ========================================================= */

function setupPhoenixAction(
  player
) {

  $("actionIcon").textContent =
    "🦅";

  $("actionTitle").textContent =
    "العنقاء";

  $("actionDescription").textContent =
    "لا تملك حركة ليلية. إذا مت، ستبقى ميتًا حتى انتهاء التصويت، ثم تعود إلى الحياة مرة واحدة فقط.";


  $("skipActionBtn")
    ?.classList.remove(
      "hidden"
    );


  state.currentAction =
    "phoenix-skip";

}


/* =========================================================
   TRAPPER
   ========================================================= */

function setupTrapperAction(
  player
) {

  $("actionIcon").textContent =
    "🕶️";


  const trapper =
    state.trapperStates[
      player.id
    ];


  if (!trapper) {

    state.trapperStates[
      player.id
    ] = {

      uses:
        0,

      targetId:
        null,

      targetNight:
        null

    };

  }


  const currentTrapper =
    state.trapperStates[
      player.id
    ];


  const remaining =
    2 -
    currentTrapper.uses;


  if (
    remaining <= 0
  ) {

    $("actionTitle").textContent =
      "ناصب الفخاخ";

    $("actionDescription").textContent =
      "لقد استخدمت الفخ مرتين. لا يمكنك استخدامه مرة أخرى.";

    $("skipActionBtn")
      ?.classList.remove(
        "hidden"
      );

    state.currentAction =
      "trapper-skip";

    return;

  }


  $("actionTitle").textContent =
    "ضع فخًا";


  $("actionDescription").textContent =
    `اختر لاعبًا لوضع الفخ عليه لهذه الليلة. المتبقي: ${remaining} استخدام.`;


  state.currentAction =
    "trapper";


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

}


/* =========================================================
   PHILOSOPHER
   ========================================================= */

function setupPhilosopherAction(
  player
) {

  $("actionIcon").textContent =
    "🧠";


  const philosopher =
    state.philosopherStates[
      player.id
    ] || {

      firstTarget:
        null,

      firstNight:
        null

    };


  state.philosopherStates[
    player.id
  ] =
    philosopher;


  if (
    philosopher.firstTarget
  ) {

    const previousTarget =
      getPlayer(
        philosopher.firstTarget
      );


    if (
      !previousTarget ||
      !previousTarget.alive
    ) {

      philosopher.firstTarget =
        null;

      philosopher.firstNight =
        null;

    }

  }


  const targets =
    alivePlayers().filter(
      target =>
        target.id !==
        player.id
    );


  state.currentAction =
    "philosopher";

  state.selectedTarget =
    null;


  if (
    philosopher.firstTarget
  ) {

    const sameTarget =
      getPlayer(
        philosopher.firstTarget
      );


    $("actionTitle").textContent =
      "الزيارة الثانية";


    $("actionDescription").textContent =
      `يجب أن تزور ${
        sameTarget
          ? sameTarget.name
          : "هذا اللاعب"
      } مرة أخرى لمعرفة المعلومات.`;


    renderTargets(
      targets.filter(
        target =>
          target.id ===
          philosopher.firstTarget
      ),
      false
    );

  } else {

    $("actionTitle").textContent =
      "الزيارة الأولى";


    $("actionDescription").textContent =
      "اختر لاعبًا. لن تعرف أي معلومة الآن، ويجب أن تزور اللاعب نفسه في ليلة لاحقة لمعرفة دوره وما فعله.";


    renderTargets(
      targets,
      false
    );

  }

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
    "قدرتك لا تعمل في الليل. إذا خرجت بالتصويت، تستطيع اختيار لاعب.";


  $("skipActionBtn")
    ?.classList.remove(
      "hidden"
    );

  $("confirmActionBtn")
    ?.classList.add(
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


  $("confirmActionBtn")
    ?.classList.add(
      "hidden"
    );


  state.currentAction =
    "skip";

}


/* =========================================================
   NIGHT ACTION HISTORY
   ========================================================= */

function recordNightAction(
  player
) {

  if (!player) return;


  if (
    !state.nightActionHistory[
      state.night
    ]
  ) {

    state.nightActionHistory[
      state.night
    ] = {};

  }


  let action =
    state.currentAction;

  let targetId =
    state.selectedTarget ||
    null;


  if (
    action === "skip" ||
    action === "samurai-skip" ||
    action === "phoenix-skip" ||
    action === "witch" ||
    action === "trapper-skip"
  ) {

    action =
      "none";

    targetId =
      null;

  }


  state.nightActionHistory[
    state.night
  ][
    player.id
  ] = {

    action,
    targetId

  };

}


/* =========================================================
   DESCRIBE NIGHT ACTION
   ========================================================= */

function describeNightAction(
  record
) {

  if (
    !record ||
    !record.action ||
    record.action === "none"
  ) {

    return "لم يستخدم قدرته في تلك الليلة.";

  }


  const target =
    record.targetId
      ? getPlayer(
          record.targetId
        )
      : null;


  const targetName =
    target
      ? escapeHTML(
          target.name
        )
      : null;


  switch (
    record.action
  ) {

    case "wolf":

      return targetName
        ? `هاجم <strong>${targetName}</strong>.`
        : "هاجم لاعبًا.";

    case "doctor":

      return targetName
        ? `حاول حماية <strong>${targetName}</strong>.`
        : "استخدم قدرته للحماية.";

    case "seer":

      return targetName
        ? `كشف دور <strong>${targetName}</strong>.`
        : "استخدم قدرته للكشف.";

    case "witch-heal":

      return "استخدم إكسير الشفاء.";

    case "witch-poison":

      return targetName
        ? `استخدم السم على <strong>${targetName}</strong>.`
        : "استخدم السم.";

    case "philosopher":

      return targetName
        ? `زار <strong>${targetName}</strong>.`
        : "استخدم قدرة الفيلسوف.";

    case "trapper":

      return targetName
        ? `وضع فخًا على <strong>${targetName}</strong>.`
        : "وضع فخًا.";

    default:

      return "لم يستخدم قدرته في تلك الليلة.";

  }

}


/* =========================================================
   PHILOSOPHER RESULT
   ========================================================= */

function showPhilosopherResult(
  philosopher,
  target
) {

  if (
    !philosopher ||
    !target
  ) {

    finishNightTurn();

    return;

  }


  const stateData =
    state.philosopherStates[
      philosopher.id
    ];


  if (
    !stateData ||
    !stateData.firstTarget ||
    stateData.firstNight == null
  ) {

    finishNightTurn();

    return;

  }


  const role =
    getRole(target);


  const record =
    state.nightActionHistory[
      stateData.firstNight
    ]?.[
      target.id
    ] || {

      action:
        "none",

      targetId:
        null

    };


  const actionText =
    describeNightAction(
      record
    );


  const message = `

    <strong>
      ${escapeHTML(
        target.name
      )}
    </strong>

    <br><br>

    🎭 دوره:

    <br>

    <strong>
      ${role?.icon || "❓"}
      ${escapeHTML(
        role?.name ||
        "غير معروف"
      )}
    </strong>

    <br><br>

    📖 قدرته:

    <br>

    ${escapeHTML(
      role?.description ||
      "لا توجد معلومات."
    )}

    <br><br>

    🌙 ما فعله في الليلة
    ${stateData.firstNight}:

    <br>

    ${actionText}

  `;


  state.philosopherStates[
    philosopher.id
  ] = {

    firstTarget:
      null,

    firstNight:
      null

  };


  showModal(
    "🧠 معلومات الفيلسوف",
    "",
    "🧠",
    () => {

      state.actionLocked =
        false;

      finishNightTurn();

    },
    true
  );


  if (
    $("modalText")
  ) {

    $("modalText").innerHTML =
      message;

  }

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


  if (
    !player ||
    !player.alive
  ) {

    return;

  }


  const action =
    state.currentAction;


  /*
   * القاتل والطبيب لا يمكنهما التخطي.
   */

  if (
    action === "wolf" ||
    action === "doctor"
  ) {

    if (
      !state.selectedTarget
    ) {

      showToast(
        "يجب اختيار لاعب أولًا.",
        "error"
      );

      return;

    }

  }


  state.actionLocked =
    true;


  $("confirmActionBtn")
    ?.setAttribute(
      "disabled",
      "disabled"
    );


  switch (
    action
  ) {

    /* =====================================================
       TRAPPER
       ===================================================== */

    case "trapper": {

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
          "اختر لاعبًا لوضع الفخ عليه.",
          "error"
        );

        return;

      }


      const trapper =
        state.trapperStates[
          player.id
        ];


      if (!trapper) {

        state.actionLocked =
          false;

        $("confirmActionBtn")
          ?.removeAttribute(
            "disabled"
          );

        return;

      }


      if (
        trapper.uses >= 2
      ) {

        state.actionLocked =
          false;

        $("confirmActionBtn")
          ?.removeAttribute(
            "disabled"
          );

        showToast(
          "لقد استخدمت الفخ مرتين.",
          "error"
        );

        return;

      }


      const target =
        getPlayer(
          state.selectedTarget
        );


      if (
        !target ||
        !target.alive ||
        target.id ===
          player.id
      ) {

        state.actionLocked =
          false;

        $("confirmActionBtn")
          ?.removeAttribute(
            "disabled"
          );

        showToast(
          "هذا اللاعب غير متاح.",
          "error"
        );

        return;

      }


      trapper.uses +=
        1;

      trapper.targetId =
        target.id;

      trapper.targetNight =
        state.night;


      /*
       * لا نعرض أي إشعار عام
       * حتى لا يعرف الآخرون من وضع الفخ.
       */

      finishNightTurn();

      return;

    }


    /* =====================================================
       WOLF
       ===================================================== */

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
          "اختر ضحية أولًا.",
          "error"
        );

        return;

      }


      const target =
        getPlayer(
          state.selectedTarget
        );


      if (
        !target ||
        !target.alive ||
        target.id ===
          player.id ||
        target.role ===
          "werewolf"
      ) {

        state.actionLocked =
          false;

        $("confirmActionBtn")
          ?.removeAttribute(
            "disabled"
          );

        showToast(
          "هذا اللاعب غير متاح.",
          "error"
        );

        return;

      }


      state.wolfChoices[
        player.id
      ] =
        target.id;


      finishNightTurn();

      return;

    }


    /* =====================================================
       SAMURAI DUEL
       ===================================================== */

    case "samurai-duel": {

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
          "اختر لاعبًا للمبارزة.",
          "error"
        );

        return;

      }


      const target =
        getPlayer(
          state.selectedTarget
        );


      if (
        !target ||
        !target.alive ||
        target.id ===
          player.id
      ) {

        state.actionLocked =
          false;

        $("confirmActionBtn")
          ?.removeAttribute(
            "disabled"
          );

        showToast(
          "هذا اللاعب غير متاح.",
          "error"
        );

        return;

      }


      if (
        target.role ===
        "werewolf"
      ) {

        target.alive =
          false;


        if (
          $("voteResultText")
        ) {

          $("voteResultText").innerHTML = `

            ⚔️ الساموراي اختار:

            <br><br>

            <strong>
              ${escapeHTML(
                target.name
              )}
            </strong>

            <br><br>

            🔪 كان من المرتزقة وخرج من اللعبة.

          `;

        }

      } else {

        if (
          $("voteResultText")
        ) {

          $("voteResultText").innerHTML = `

            ⚔️ الساموراي اختار:

            <br><br>

            <strong>
              ${escapeHTML(
                target.name
              )}
            </strong>

            <br><br>

            كان من فريق القرية.

          `;

        }

      }


      state.selectedTarget =
        null;

      state.samuraiMode =
        false;

      state.samuraiQueue =
        [];


      $("confirmActionBtn")
        ?.removeAttribute(
          "disabled"
        );


      if (
        checkWinner()
      ) {

        return;

      }


      showScreen(
        "voteResultScreen"
      );

      return;

    }


    /* =====================================================
       DOCTOR
       ===================================================== */

    case "doctor": {

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
          "يجب اختيار لاعب لحمايته.",
          "error"
        );

        return;

      }


      const target =
        getPlayer(
          state.selectedTarget
        );


      if (
        !target ||
        !target.alive
      ) {

        state.actionLocked =
          false;

        $("confirmActionBtn")
          ?.removeAttribute(
            "disabled"
          );

        showToast(
          "هذا اللاعب لم يعد متاحًا.",
          "error"
        );

        return;

      }


      state.doctorTarget =
        target.id;


      finishNightTurn();

      return;

    }


    /* =====================================================
       SEER
       ===================================================== */

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
          "اختر لاعبًا للكشف.",
          "error"
        );

        return;

      }


      const target =
        getPlayer(
          state.selectedTarget
        );


      if (
        !target ||
        !target.alive ||
        target.id ===
          player.id
      ) {

        state.actionLocked =
          false;

        $("confirmActionBtn")
          ?.removeAttribute(
            "disabled"
          );

        showToast(
          "هذا اللاعب غير متاح.",
          "error"
        );

        return;

      }


      state.seerTarget =
        target.id;


      const targetRole =
        getRole(
          target
        );


      showModal(
        "🔮 كشف العراف",
        `${target.name} دوره هو: ${targetRole?.icon || "❓"} ${targetRole?.name || "غير معروف"}`,
        "🔮",
        () => {

          state.actionLocked =
            false;

          finishNightTurn();

        },
        true
      );


      return;

    }


    /* =====================================================
       WITCH HEAL
       ===================================================== */

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
          "إكسير الشفاء غير متاح.",
          "error"
        );

        return;

      }


      witch.healUsed =
        true;


      state.isGroupPotionActive =
        true;


      /*
       * لا يوجد إشعار عام باستخدام الإكسير.
       */

      finishNightTurn();

      return;

    }


    /* =====================================================
       WITCH POISON
       ===================================================== */

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
          "السم غير متاح.",
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
          "اختر لاعبًا لتسميمه.",
          "error"
        );

        return;

      }


      const target =
        getPlayer(
          state.selectedTarget
        );


      if (
        !target ||
        !target.alive ||
        target.id ===
          player.id
      ) {

        state.actionLocked =
          false;

        $("confirmActionBtn")
          ?.removeAttribute(
            "disabled"
          );

        showToast(
          "هذا اللاعب غير متاح.",
          "error"
        );

        return;

      }


      witch.poisonUsed =
        true;


      if (
        !state.nightPoisonTargets.includes(
          target.id
        )
      ) {

        state.nightPoisonTargets.push(
          target.id
        );

      }


      /*
       * لا يوجد إشعار عام باستخدام السم.
       */

      finishNightTurn();

      return;

    }


    /* =====================================================
       PHILOSOPHER
       ===================================================== */

    case "philosopher": {

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
          "اختر لاعبًا.",
          "error"
        );

        return;

      }


      const target =
        getPlayer(
          state.selectedTarget
        );


      if (
        !target ||
        !target.alive ||
        target.id ===
          player.id
      ) {

        state.actionLocked =
          false;

        $("confirmActionBtn")
          ?.removeAttribute(
            "disabled"
          );

        showToast(
          "هذا اللاعب غير متاح.",
          "error"
        );

        return;

      }


      const philosopher =
        state.philosopherStates[
          player.id
        ] || {

          firstTarget:
            null,

          firstNight:
            null

        };


      state.philosopherStates[
        player.id
      ] =
        philosopher;


      if (
        !philosopher.firstTarget
      ) {

        philosopher.firstTarget =
          target.id;

        philosopher.firstNight =
          state.night;


        /*
         * لا نعرض أي إشعار عام عن اختيار الفيلسوف.
         */

        finishNightTurn();

        return;

      }


      if (
        philosopher.firstTarget !==
        target.id
      ) {

        state.actionLocked =
          false;

        $("confirmActionBtn")
          ?.removeAttribute(
            "disabled"
          );

        showToast(
          "يجب أن تزور اللاعب نفسه الذي زرته في المرة الأولى.",
          "error"
        );

        return;

      }


      showPhilosopherResult(
        player,
        target
      );

      return;

    }


    default:

      finishNightTurn();

      return;

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


  /*
   * القاتل والطبيب ممنوع عليهم التخطي.
   */

  if (
    state.currentAction ===
      "wolf" ||
    state.currentAction ===
      "doctor"
  ) {

    showToast(
      "لا يمكنك تخطي هذا الدور.",
      "error"
    );

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


  if (
    state.currentPlayer
  ) {

    recordNightAction(
      state.currentPlayer
    );

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


  state.selectedTarget =
    null;


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

  } else if (
    $("passPlayerName")
  ) {

    $("passPlayerName")
      .textContent =
      playerOrName;

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
   PHOENIX — DEATH HANDLER
   ========================================================= */

function handlePhoenixDeath(
  player
) {

  if (
    !player ||
    player.role !==
      "phoenix"
  ) {

    return false;

  }


  if (
    !state.phoenixStates[
      player.id
    ]
  ) {

    state.phoenixStates[
      player.id
    ] = {

      used:
        false,

      pending:
        false

    };

  }


  const phoenix =
    state.phoenixStates[
      player.id
    ];


  /*
   * أول موت:
   * يموت فعلًا ويبقى ميتًا حتى انتهاء التصويت.
   */

  if (
    !phoenix.used
  ) {

    phoenix.used =
      true;

    phoenix.pending =
      true;

    player.alive =
      false;

    return true;

  }


  /*
   * الموت الثاني نهائي.
   */

  phoenix.pending =
    false;

  player.alive =
    false;

  return false;

}


/* =========================================================
   PHOENIX — REVIVE AFTER VOTING
   ========================================================= */

function revivePendingPhoenixes() {

  const revived =
    [];


  state.players.forEach(
    player => {

      if (
        player.role !==
        "phoenix"
      ) {

        return;

      }


      const phoenix =
        state.phoenixStates[
          player.id
        ];


      if (
        !phoenix ||
        !phoenix.pending
      ) {

        return;

      }


      /*
       * هنا فقط ترجع العنقاء:
       * بعد انتهاء التصويت وقبل بداية الليلة الجديدة.
       */

      player.alive =
        true;

      phoenix.pending =
        false;


      const sound =
        getPhoenixReviveSound();


      if (
        !audioSystem.isUserMuted &&
        sound
      ) {

        sound.currentTime =
          0;

        sound.volume =
          0.8;

        sound.play()
          .catch(() => {});

      }


      revived.push(
        player
      );

    }
  );


  return revived;

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


  const aliveWolves =
    alivePlayers().filter(
      player =>
        player.role ===
        "werewolf"
    );


  const wolfChoices =
    aliveWolves
      .map(
        wolf =>
          state.wolfChoices[
            wolf.id
          ]
      )
      .filter(
        targetId => {

          if (!targetId) {
            return false;
          }


          const target =
            getPlayer(
              targetId
            );


          return (
            target &&
            target.alive &&
            target.role !==
              "werewolf"
          );

        }
      );


  if (
    wolfChoices.length >
    0
  ) {

    const uniqueTargets =
      [
        ...new Set(
          wolfChoices
        )
      ];


    let wolfTargetId =
      null;


    if (
      uniqueTargets.length ===
      1
    ) {

      wolfTargetId =
        uniqueTargets[0];

    } else if (
      uniqueTargets.length ===
      2
    ) {

      wolfTargetId =
        Math.random() <
        0.5
          ? uniqueTargets[0]
          : uniqueTargets[1];

    } else {

      wolfTargetId =
        uniqueTargets[
          Math.floor(
            Math.random() *
            uniqueTargets.length
          )
        ];

    }


    const wolfTarget =
      getPlayer(
        wolfTargetId
      );


    if (wolfTarget) {

      let trapTriggered =
        false;


      const trappers =
        alivePlayers().filter(
          player =>
            player.role ===
            "trapper"
        );


      for (
        const trapper of
        trappers
      ) {

        const trap =
          state.trapperStates[
            trapper.id
          ];


        if (!trap) {
          continue;
        }


        if (
          trap.targetId ===
            wolfTarget.id &&
          trap.targetNight ===
            state.night
        ) {

          trapTriggered =
            true;


          trap.targetId =
            null;

          trap.targetNight =
            null;


          /*
           * الفخ يقتل فقط القتلة
           * الذين اختاروا نفس الضحية.
           */

          aliveWolves.forEach(
            attacker => {

              if (
                state.wolfChoices[
                  attacker.id
                ] ===
                wolfTarget.id
              ) {

                attacker.alive =
                  false;

              }

            }
          );


          break;

        }

      }


      if (
        !trapTriggered
      ) {

        if (
          wolfTarget.role ===
          "samurai"
        ) {

          const samuraiState =
            state.samuraiStates[
              wolfTarget.id
            ];


          if (
            samuraiState &&
            !samuraiState.nightProtectionUsed
          ) {

            samuraiState
              .nightProtectionUsed =
              true;

          } else {

            deaths.add(
              wolfTarget.id
            );

          }

        } else {

          deaths.add(
            wolfTarget.id
          );

        }

      }

    }

  }


  /*
   * حماية الطبيب.
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
   * الحماية العادية.
   */

  if (
    !state.isGroupPotionActive
  ) {

    state.nightProtectedPlayers
      .forEach(
        id =>
          deaths.delete(
            id
          )
      );

  }


  /*
   * إكسير الشفاء يحمي الجميع
   * من كل شيء ما عدا السم.
   */

  if (
    state.isGroupPotionActive
  ) {

    deaths.clear();

  }


  /*
   * السم يطبق بعد الحماية الجماعية.
   */

  state.nightPoisonTargets
    .forEach(
      id => {

        const target =
          getPlayer(
            id
          );


        if (
          target &&
          target.alive
        ) {

          deaths.add(
            id
          );

        }

      }
    );


  state.nightDeaths =
    [
      ...deaths
    ];


  /*
   * تنفيذ الموت.
   *
   * العنقاء تموت فعلًا الآن
   * ولا ترجع إلا بعد التصويت.
   */

  state.nightDeaths.forEach(
    id => {

      const player =
        getPlayer(
          id
        );


      if (
        !player ||
        !player.alive
      ) {

        return;

      }


      if (
        player.role ===
        "phoenix"
      ) {

        handlePhoenixDeath(
          player
        );

        return;

      }


      player.alive =
        false;

    }
  );


  /*
   * لا يوجد Hunter بعد الموت الليلي.
   * قدرة الصياد فقط عند خروجه بالتصويت.
   */

  finishNightResult();

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
        player =>
          player
      );


  if (
    deaths.length ===
    0
  ) {

    if (
      $("nightResultText")
    ) {

      $("nightResultText").innerHTML =
        `
          🌙 مرت الليلة بسلام.
          <br>
          لم يمت أي لاعب.
        `;

    }

  } else {

    const html =
      `
        مات هذه الليلة:
        <br><br>

        ${
          deaths
            .map(
              player =>
                `
                  <strong>
                    💀
                    ${escapeHTML(
                      player.name
                    )}
                  </strong>
                `
            )
            .join(
              "<br>"
            )
        }
      `;


    if (
      $("nightResultText")
    ) {

      $("nightResultText")
        .innerHTML =
        html;

    }

  }


  showScreen(
    "nightResultScreen"
  );


  /*
   * لا نعيد العنقاء هنا.
   */

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


          startVoting();

        }

      },
      1000
    );

}


/* =========================================================
   UPDATE TIMER
   ========================================================= */

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
    state.players.filter(
      player =>
        player.alive
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
   SHOW NEXT VOTER
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


  if (
    $("votingPlayerName")
  ) {

    $("votingPlayerName")
      .textContent =
      voter.name;

  }


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
   RENDER VOTING TARGETS
   ========================================================= */

function renderVotingTargets(
  voter
) {

  const container =
    $("votingTargets");


  if (!container) {
    return;
  }


  const targets =
    alivePlayers().filter(
      player =>
        player.id !==
        voter.id
    );


  container.innerHTML =
    targets
      .map(
        player =>
          `

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
      )
      .join("");


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


  container.onclick =
    function(event) {

      const button =
        event.target.closest(
          ".target-btn"
        );


      if (
        !button ||
        !container.contains(
          button
        )
      ) {

        return;

      }


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

    };

}


/* =========================================================
   CONFIRM VOTE
   ========================================================= */

function confirmVote() {

  if (
    state.voteLocked ||
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


  if (
    state.selectedVote !==
    "SKIP"
  ) {

    const target =
      getPlayer(
        state.selectedVote
      );


    if (
      !target ||
      !target.alive ||
      target.id ===
        voter.id
    ) {

      state.selectedVote =
        null;

      showToast(
        "هذا اللاعب لم يعد متاحًا",
        "error"
      );

      return;

    }

  }


  if (
    Object.prototype.hasOwnProperty.call(
      state.votes,
      voter.id
    )
  ) {

    return;

  }


  state.voteLocked =
    true;


  $("confirmVoteBtn")
    ?.setAttribute(
      "disabled",
      "disabled"
    );


  state.votes[
    voter.id
  ] =
    state.selectedVote;


  audioSystem.playVotingSound();


  state.votingIndex++;


  state.selectedVote =
    null;


  if (
    state.votingIndex >=
    state.votingOrder.length
  ) {

    resolveVotes();

    return;

  }


  showPassScreen(
    state.votingOrder[
      state.votingIndex
    ],
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
    )
      .filter(
        vote =>
          vote ===
          "SKIP"
      )
      .length;


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

  }


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


  /* =====================================================
     PHOENIX
     ===================================================== */

  if (
    eliminated.role ===
    "phoenix"
  ) {

    const firstDeath =
      handlePhoenixDeath(
        eliminated
      );


    if (
      firstDeath
    ) {

      if (
        $("voteResultText")
      ) {

        $("voteResultText")
          .innerHTML = `

            🦅 خرج من التصويت:

            <br><br>

            <strong>
              ${escapeHTML(
                eliminated.name
              )}
            </strong>

            <br><br>

            ✨ لقد استُخدمت قدرة العنقاء.

            <br>

            ستبقى خارج اللعبة حتى انتهاء
            التصويت، ثم تعود إلى الحياة.

          `;

      }


      showScreen(
        "voteResultScreen"
      );

      return;

    }


    /*
     * الموت الثاني:
     * handlePhoenixDeath جعلها ميتة نهائيًا.
     */

    if (
      $("voteResultText")
    ) {

      $("voteResultText")
        .innerHTML = `

          💀 خرجت العنقاء نهائيًا:

          <br><br>

          <strong>
            ${escapeHTML(
              eliminated.name
            )}
          </strong>

          <br><br>

          انتهت قدرتها على العودة.

        `;

    }

  } else {

    eliminated.alive =
      false;

  }


  /* =====================================================
     SAMURAI
     ===================================================== */

  if (
    eliminated.role ===
    "samurai"
  ) {

    if (
      $("voteResultText")
    ) {

      $("voteResultText")
        .innerHTML = `

          ⚔️ خرج من اللعبة:

          <br><br>

          <strong>
            ${escapeHTML(
              eliminated.name
            )}
          </strong>

          <br><br>

          لديه مبارزة أخيرة قبل انتهاء دوره.

        `;

    }


    state.samuraiQueue =
      [eliminated];

    state.samuraiMode =
      true;


    showScreen(
      "voteResultScreen"
    );

    return;

  }


  /* =====================================================
     HUNTER
     ===================================================== */

  if (
    eliminated.role ===
    "hunter"
  ) {

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

          يستطيع الصياد الآن اختيار لاعب ليخرج معه.

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


  /*
   * إذا كانت العنقاء ماتت موتًا نهائيًا
   * ولم تكن ساموراي أو صياد، نعرض النتيجة.
   */

  if (
    eliminated.role !==
    "phoenix"
  ) {

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

          تم إخراجه من اللعبة.

        `;

    }

  }


  showScreen(
    "voteResultScreen"
  );

}


/* =========================================================
   HUNTER — VOTE ONLY
   ========================================================= */

function startNextHunterTurn() {

  if (
    state.hunterQueue.length ===
    0
  ) {

    state.hunterMode =
      null;

    finishVoteResult();

    return;

  }


  /*
   * مهم:
   * الصياد الذي خرج بالتصويت يكون alive=false،
   * ومع ذلك يجب أن يحصل على قدرته.
   */

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

  state.currentAction =
    "hunter";


  if (
    $("actionPlayerName")
  ) {

    $("actionPlayerName")
      .textContent =
      hunter.name;

  }


  $("actionIcon").textContent =
    "🏹";

  $("actionTitle").textContent =
    "اختر لاعبًا";


  $("actionDescription").textContent =
    "لقد خرجت بالتصويت. يمكنك إسقاط لاعب آخر معك.";


  $("confirmActionBtn")
    ?.classList.remove(
      "hidden"
    );

  $("confirmActionBtn")
    ?.removeAttribute(
      "disabled"
    );


  /*
   * الصياد لا يحتاج تخطي إذا كانت قدرته إلزامية.
   */

  $("skipActionBtn")
    ?.classList.add(
      "hidden"
    );


  updatePlayerAvatars();


  renderTargets(
    alivePlayers(),
    false
  );


  showScreen(
    "actionScreen"
  );

}


/* =========================================================
   HUNTER CONFIRM
   ========================================================= */

function handleHunterConfirm() {

  if (
    state.actionLocked
  ) {

    return;

  }


  /*
   * الصياد يعمل فقط بعد التصويت.
   */

  if (
    state.hunterMode !==
    "vote"
  ) {

    return;

  }


  const hunter =
    state.currentPlayer;


  if (!hunter) {

    return;

  }


  if (
    !state.selectedTarget
  ) {

    showToast(
      "اختر لاعبًا أولًا",
      "error"
    );

    return;

  }


  const target =
    getPlayer(
      state.selectedTarget
    );


  if (
    !target ||
    !target.alive ||
    target.id ===
      hunter.id
  ) {

    state.selectedTarget =
      null;

    showToast(
      "هذا اللاعب غير متاح",
      "error"
    );

    return;

  }


  state.actionLocked =
    true;


  $("confirmActionBtn")
    ?.setAttribute(
      "disabled",
      "disabled"
    );


  if (
    target.role ===
    "phoenix"
  ) {

    handlePhoenixDeath(
      target
    );

  } else {

    target.alive =
      false;

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

  /*
   * لا يوجد تخطي للصياد بعد خروجه بالتصويت.
   */

  if (
    state.hunterMode !==
    "vote"
  ) {

    return;

  }


  showToast(
    "يجب على الصياد اختيار لاعب.",
    "error"
  );

}


/* =========================================================
   CONTINUE AFTER VOTE
   ========================================================= */

function continueAfterVote() {

  /*
   * أولًا المبارزة.
   */

  if (
    state.samuraiMode &&
    state.samuraiQueue.length >
      0
  ) {

    state.actionLocked =
      false;

    startSamuraiDuel();

    return;

  }


  /*
   * بعدها قدرة الصياد.
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
   * الآن فقط تعود العنقاء.
   *
   * هذا هو المكان الوحيد الذي يتم فيه
   * إحياء العنقاء بعد التصويت.
   */

  const revivedPhoenixes =
    revivePendingPhoenixes();


  if (
    revivedPhoenixes.length >
    0
  ) {

    const names =
      revivedPhoenixes
        .map(
          player =>
            escapeHTML(
              player.name
            )
        )
        .join(
          "، "
        );


    if (
      $("voteResultText")
    ) {

      $("voteResultText")
        .innerHTML += `

          <br><br>

          🦅
          <strong>
            العنقاء عادت إلى الحياة!
          </strong>

          <br>

          ${names}

        `;

    }


    showToast(
      `🦅 ${names} عادت إلى الحياة!`,
      "success"
    );

  }


  if (
    checkWinner()
  ) {

    return;

  }


  state.hunterMode =
    null;

  state.hunterQueue =
    [];


  state.samuraiMode =
    false;

  state.samuraiQueue =
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
   SAMURAI DUEL
   ========================================================= */

function startSamuraiDuel() {

  if (
    state.samuraiQueue.length ===
    0
  ) {

    state.samuraiMode =
      false;

    return;

  }


  const samurai =
    state.samuraiQueue.shift();


  if (!samurai) {

    startSamuraiDuel();

    return;

  }


  /*
   * الساموراي الخارج بالتصويت يجب أن يحصل
   * على المبارزة حتى لو alive=false.
   */


  state.currentPlayer =
    samurai;

  state.selectedTarget =
    null;

  state.actionLocked =
    false;

  state.currentAction =
    "samurai-duel";


  if (
    $("actionPlayerName")
  ) {

    $("actionPlayerName")
      .textContent =
      samurai.name;

  }


  $("actionIcon").textContent =
    "⚔️";

  $("actionTitle").textContent =
    "المبارزة الأخيرة";

  $("actionDescription").textContent =
    "اختر لاعبًا واحدًا لمبارزته. إذا كان من المرتزقة، سيخرج معك.";


  $("confirmActionBtn")
    ?.classList.remove(
      "hidden"
    );


  $("confirmActionBtn")
    ?.removeAttribute(
      "disabled"
    );


  $("skipActionBtn")
    ?.classList.add(
      "hidden"
    );


  updatePlayerAvatars();


  const targets =
    alivePlayers().filter(
      player =>
        player.id !==
        samurai.id
    );


  renderTargets(
    targets,
    false
  );


  showScreen(
    "actionScreen"
  );

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
      .innerHTML +=
      `<br><br>انتهى التصويت.`;

  }


  showScreen(
    "voteResultScreen"
  );

}


/* =========================================================
   WINNER CHECK
   ========================================================= */

function checkWinner() {

  /*
   * إذا العنقاء ميتة مؤقتًا،
   * لا ننهي اللعبة قبل أن تأخذ فرصة العودة
   * بعد التصويت.
   */

  const phoenixWaiting =
    state.players.some(
      player =>
        player.role ===
          "phoenix" &&
        state.phoenixStates[
          player.id
        ]?.pending
    );


  if (
    phoenixWaiting
  ) {

    return false;

  }


  const wolves =
    getAliveWolves().length;


  const villagers =
    getAliveVillagers().length;


  if (
    wolves ===
    0
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
   WINNER
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
        ? "فاز المرتزقة"
        : "فازت القرية";

  }


  if (
    $("winnerDescription")
  ) {

    $("winnerDescription")
      .textContent =
      description;

  }


  showScreen(
    "winnerScreen"
  );


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

  } else {

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

  /*
   * مهم:
   * لعبة جديدة = تصفير اللاعبين أيضًا.
   * سابقًا كانت resetGameData(true)
   * تبقي الأسماء القديمة.
   */

  resetGameData(
    false
  );


  state.activeRoles = {

    werewolf:
      true,

    samurai:
      true,

    doctor:
      true,

    seer:
      true,

    witch:
      true,

    hunter:
      true,

    phoenix:
      true,

    philosopher:
      true,

    trapper:
      true,

    villager:
      true

  };


  state.distributionMode =
    "random";


  state.manualRoles =
    {};


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

    "أولًا أضف اللاعبين والصور. بعدها اختر الأدوار التي تريدها واختر بين التوزيع العشوائي أو اليدوي. في التوزيع العشوائي يمكن أن تتكرر الأدوار. العنقاء إذا ماتت لا تعود في بداية الصباح، بل تبقى ميتة حتى انتهاء التصويت ثم تعود إلى الحياة مرة واحدة فقط. الفيلسوف يزور لاعبًا مرة أولى دون معرفة معلومات عنه، ثم يجب أن يعود إلى اللاعب نفسه في ليلة لاحقة ليعرف دوره وقدرته وما فعله في الزيارة السابقة. في التوزيع اليدوي تختار دور كل لاعب بنفسك. بعد بدء اللعبة سيكشف كل لاعب دوره بشكل سري، ثم تبدأ أدوار الليل والنقاش والتصويت حتى يفوز أحد الفريقين.",

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
      () =>
        showScreen(
          "playersScreen"
        )
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
      () =>
        showScreen(
          "homeScreen"
        )
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


  $("randomRoleModeBtn")
    ?.addEventListener(
      "click",
      () =>
        setDistributionMode(
          "random"
        )
    );


  $("manualRoleModeBtn")
    ?.addEventListener(
      "click",
      () =>
        setDistributionMode(
          "manual"
        )
    );


  $("gameHomeBtn")
    ?.addEventListener(
      "click",
      () =>
        confirmExitGame(
          "home"
        )
    );


  $("gameHomeBtnAction")
    ?.addEventListener(
      "click",
      () =>
        confirmExitGame(
          "home"
        )
    );


  $("gameHomeBtnVoting")
    ?.addEventListener(
      "click",
      () =>
        confirmExitGame(
          "home"
        )
    );


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


  $("backPlayersBtn")
    ?.addEventListener(
      "click",
      () =>
        showScreen(
          "playersScreen"
        )
    );


  $("roleOptions")
    ?.addEventListener(
      "click",
      event => {

        const button =
          event.target.closest(
            ".role-option"
          );


        if (!button) {
          return;
        }


        toggleRole(
          button.dataset.role
        );

      }
    );


  $("toReviewBtn")
    ?.addEventListener(
      "click",
      prepareReview
    );


  $("backRolesBtn")
    ?.addEventListener(
      "click",
      () =>
        showScreen(
          "rolesSetupScreen"
        )
    );


  $("startGameBtn")
    ?.addEventListener(
      "click",
      startGame
    );


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


  $("continuePassBtn")
    ?.addEventListener(
      "click",
      continuePass
    );


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


  $("startDiscussionBtn")
    ?.addEventListener(
      "click",
      startDiscussion
    );


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


  $("continueAfterVoteBtn")
    ?.addEventListener(
      "click",
      continueAfterVote
    );


  $("newGameBtn")
    ?.addEventListener(
      "click",
      newGame
    );


  $("closeModalBtn")
    ?.addEventListener(
      "click",
      () =>
        closeModal(
          false
        )
    );


  $("modalOkBtn")
    ?.addEventListener(
      "click",
      () =>
        closeModal(
          true
        )
    );


  $("modal")
    ?.addEventListener(
      "click",
      event => {

        if (
          event.target ===
          $("modal")
        ) {

          closeModal(
            false
          );

        }

      }
    );


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

        closeModal(
          false
        );

      }

    }
  );


  $("avatarInput")
    ?.addEventListener(
      "change",
      handleAvatarUpload
    );

}


/* =========================================================
   INIT
   ========================================================= */

function initGame() {

  audioSystem.init();

  bindEvents();

  renderPlayerList();

  renderRoleOptions();

  updateRoleSummary();

  setDistributionMode(
    "random"
  );


  getBgMusic();
  getDiscussionMusic();
  getVillageWinMusic();
  getMercenariesWinMusic();
  getPhoenixReviveSound();


  setTimeout(
    () =>
      showScreen(
        "homeScreen"
      ),
    100
  );

}


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
/* =========================================================
   حد اسم اللاعب = 10 أحرف + إشعار
   ========================================================= */

const playerNameInput = document.getElementById("playerNameInput");

if (playerNameInput) {

  playerNameInput.maxLength = 10;

  playerNameInput.addEventListener("input", function () {

    if (this.value.length >= 10) {

      showGameNotification(
        "حد الأحرف المسموح هو 10 أحرف"
      );

    }

    if (this.value.length > 10) {
      this.value = this.value.slice(0, 10);
    }

  });
}
/* =========================================================
   تحديث العنقاء
   الصق هذا الكود كاملًا في آخر ملف JavaScript الحالي.
   ========================================================= */

ROLES.phoenix.description =
  "إذا مت، تبقى خارج اللعبة حتى صباح اليوم التالي، ثم تعود مرة واحدة فقط. بعد عودتك تعيش ليلة واحدة، ثم تخرج من اللعبة نهائيًا.";


function getPhoenixState(player) {

  if (!state.phoenixStates[player.id]) {

    state.phoenixStates[player.id] = {
      used: false,
      pending: false,
      reviveAtMorning: null,
      returned: false,
      expiresAfterNight: null
    };

  }

  return state.phoenixStates[player.id];

}


/* الموت الأول: تبقى العنقاء ميتة حتى صباح اليوم التالي. */
function handlePhoenixDeath(player) {

  if (!player || player.role !== "phoenix") {
    return false;
  }

  const phoenix = getPhoenixState(player);

  if (!phoenix.used) {

    phoenix.used = true;
    phoenix.pending = true;
    phoenix.reviveAtMorning = state.night + 1;
    phoenix.returned = false;
    phoenix.expiresAfterNight = null;

    player.alive = false;

    return true;

  }

  /* إذا ماتت بعد استخدام قدرتها، يكون موتها نهائيًا. */
  phoenix.pending = false;
  phoenix.reviveAtMorning = null;
  phoenix.expiresAfterNight = null;
  player.alive = false;

  return false;

}


/* الإحياء يحصل مع نتيجة الليل، أي في صباح اليوم التالي فقط. */
function revivePendingPhoenixes() {

  const revived = [];

  state.players.forEach(player => {

    if (player.role !== "phoenix") {
      return;
    }

    const phoenix = getPhoenixState(player);

    if (
      !phoenix.pending ||
      phoenix.reviveAtMorning == null ||
      state.night < phoenix.reviveAtMorning
    ) {
      return;
    }

    player.alive = true;
    phoenix.pending = false;
    phoenix.reviveAtMorning = null;
    phoenix.returned = true;

    /* تعيش النهار الحالي، ثم ليلة واحدة فقط. */
    phoenix.expiresAfterNight = state.night + 1;

    const sound = getPhoenixReviveSound();

    if (!audioSystem.isUserMuted && sound) {
      sound.currentTime = 0;
      sound.volume = 0.8;
      sound.play().catch(() => {});
    }

    revived.push(player);

  });

  return revived;

}


/* تنتهي حياة العنقاء في صباح الليلة الوحيدة التي مُنحت لها. */
function expirePhoenixesAfterOneNight() {

  const expired = [];

  state.players.forEach(player => {

    if (player.role !== "phoenix") {
      return;
    }

    const phoenix = getPhoenixState(player);

    if (
      phoenix.returned &&
      phoenix.expiresAfterNight != null &&
      state.night >= phoenix.expiresAfterNight &&
      player.alive
    ) {
      player.alive = false;
      phoenix.expiresAfterNight = null;
      expired.push(player);
    }

  });

  return expired;

}


function setupPhoenixAction(player) {

  $("actionIcon").textContent = "🦅";
  $("actionTitle").textContent = "العنقاء";
  $("actionDescription").textContent =
    "لا تملك حركة ليلية. إذا مت، ستعود في صباح اليوم التالي مرة واحدة فقط، وبعد عودتك تعيش ليلة واحدة.";

  $("skipActionBtn")?.classList.remove("hidden");

  state.currentAction = "phoenix-skip";

}


/* تعرض نتيجة الصباح ثم الإحياء أو نهاية الليلة الوحيدة للعنقاء. */
function finishNightResult() {

  const revivedPhoenixes = revivePendingPhoenixes();
  const expiredPhoenixes = expirePhoenixesAfterOneNight();

  const deaths = state.nightDeaths
    .map(id => getPlayer(id))
    .filter(player => player);

  let html = "";

  if (deaths.length === 0) {

    html = `
      🌙 مرت الليلة بسلام.
      <br>
      لم يمت أي لاعب.
    `;

  } else {

    html = `
      مات هذه الليلة:
      <br><br>
      ${
        deaths
          .map(player => `
            <strong>
              💀 ${escapeHTML(player.name)}
            </strong>
          `)
          .join("<br>")
      }
    `;

  }

  if (revivedPhoenixes.length > 0) {

    const names = revivedPhoenixes
      .map(player => escapeHTML(player.name))
      .join("، ");

    html += `
      <br><br>
      🦅 <strong>عادت العنقاء مع بداية هذا الصباح:</strong>
      <br>
      ${names}
      <br>
      ستعيش ليلة واحدة فقط.
    `;

  }

  if (expiredPhoenixes.length > 0) {

    const names = expiredPhoenixes
      .map(player => escapeHTML(player.name))
      .join("، ");

    html += `
      <br><br>
      🦅 <strong>انتهت الليلة الوحيدة للعنقاء:</strong>
      <br>
      ${names}
      <br>
      خرجت من اللعبة نهائيًا.
    `;

  }

  if ($("nightResultText")) {
    $("nightResultText").innerHTML = html;
  }

  showScreen("nightResultScreen");

  if (checkWinner()) {
    return;
  }

}


/* لا نُحيي العنقاء بعد التصويت؛ نبدأ الليلة الجديدة وهي ما زالت ميتة. */
function continueAfterVote() {

  if (state.samuraiMode && state.samuraiQueue.length > 0) {
    state.actionLocked = false;
    startSamuraiDuel();
    return;
  }

  if (state.hunterMode === "vote" && state.hunterQueue.length > 0) {
    state.actionLocked = false;
    startNextHunterTurn();
    return;
  }

  if (checkWinner()) {
    return;
  }

  state.hunterMode = null;
  state.hunterQueue = [];
  state.samuraiMode = false;
  state.samuraiQueue = [];
  state.voteLocked = false;
  state.actionLocked = false;
  state.votingResolved = false;

  state.night++;
  beginNight();

}


/* يصحح رسالة خروج العنقاء القديمة إن ظهرت بعد التصويت. */
function refreshPhoenixVoteMessage() {

  const result = $("voteResultText");

  if (
    !result ||
    !result.textContent.includes("لقد استُخدمت قدرة العنقاء")
  ) {
    return;
  }

  const waitingPhoenixes = state.players.filter(player =>
    player.role === "phoenix" &&
    getPhoenixState(player).pending
  );

  if (waitingPhoenixes.length === 0) {
    return;
  }

  result.innerHTML = `
    🦅 خرجت العنقاء من اللعبة:
    <br><br>
    <strong>
      ${waitingPhoenixes.map(player => escapeHTML(player.name)).join("، ")}
    </strong>
    <br><br>
    ستبقى ميتة خلال الليلة القادمة، ثم تعود في صباح اليوم التالي.
  `;

}


function installPhoenixVoteMessageWatcher() {

  const result = $("voteResultText");

  if (!result) {
    return;
  }

  new MutationObserver(refreshPhoenixVoteMessage).observe(
    result,
    { childList: true, subtree: true }
  );

}


function showRules() {

  showModal(
    "طريقة اللعب",
    "أولًا أضف اللاعبين والصور. بعدها اختر الأدوار التي تريدها واختر بين التوزيع العشوائي أو اليدوي. في التوزيع العشوائي يمكن أن تتكرر الأدوار. العنقاء إذا ماتت تبقى ميتة خلال الليلة القادمة، ثم تعود في صباح اليوم التالي مرة واحدة فقط. بعد عودتها تعيش ليلة واحدة ثم تخرج نهائيًا. الفيلسوف يزور لاعبًا مرة أولى دون معرفة معلومات عنه، ثم يجب أن يعود إلى اللاعب نفسه في ليلة لاحقة ليعرف دوره وقدرته وما فعله في الزيارة السابقة. في التوزيع اليدوي تختار دور كل لاعب بنفسك. بعد بدء اللعبة سيكشف كل لاعب دوره بشكل سري، ثم تبدأ أدوار الليل والنقاش والتصويت حتى يفوز أحد الفريقين.",
    "📖"
  );

}


function refreshPhoenixRoleText() {

  if (typeof renderRoleOptions === "function") {
    renderRoleOptions();
  }

}


if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", () => {
    installPhoenixVoteMessageWatcher();
    refreshPhoenixRoleText();
  });

} else {
  installPhoenixVoteMessageWatcher();
  refreshPhoenixRoleText();
}
/* =========================================================
   إضافة شخصية الصامت
   الصق هذا الكود كاملًا في آخر ملف JavaScript الحالي.
   ========================================================= */


/* تعريف الدور. */
ROLES.silent = {
  name: "الصامت",
  icon: "🤐",
  team: "wolves",
  teamName: "فريق المرتزقة",
  description:
    "مرتين في اللعبة، اختر لاعبًا ليسكت خلال النقاش التالي. تستطيع اختيار نفسك."
};

ROLE_WEIGHTS.silent = 25;


/* يبقى الدور مفعّلًا حتى بعد بدء لعبة جديدة. */
let silentActiveRoles = {
  ...state.activeRoles,
  silent: true
};

Object.defineProperty(state, "activeRoles", {
  configurable: true,

  get() {
    return silentActiveRoles;
  },

  set(roles) {
    silentActiveRoles = {
      ...roles,
      silent: true
    };
  }
});


/* الصامت يُحسب من فريق المرتزقة عند احتساب الفوز. */
function getAliveWolves() {

  return alivePlayers().filter(
    player => getRole(player)?.team === "wolves"
  );

}


function getAliveVillagers() {

  return alivePlayers().filter(
    player => getRole(player)?.team !== "wolves"
  );

}


/* لا يستطيع القاتل اختيار عضو من فريقه كضحية. */
function setupWolfAction(player) {

  $("actionIcon").textContent = "🔪";
  $("actionTitle").textContent = "اختر ضحية";
  $("actionDescription").textContent =
    "اختر لاعبًا لاستهدافه. لا يمكنك استهداف لاعب من فريقك.";

  state.currentAction = "wolf";

  const targets = alivePlayers().filter(
    target => getRole(target)?.team !== "wolves"
  );

  renderTargets(targets, false);

}


function getSilentState(player) {

  if (!state.silentStates) {
    state.silentStates = {};
  }

  if (!state.silentStates[player.id]) {
    state.silentStates[player.id] = {
      uses: 0
    };
  }

  return state.silentStates[player.id];

}


function setupSilentAction(player) {

  const silent = getSilentState(player);

  $("actionIcon").textContent = "🤐";
  $("actionTitle").textContent = "اختر من تسكته";

  $("actionDescription").textContent =
    silent.uses >= 2
      ? "استُخدمت قدرتك مرتين. يمكنك تخطي دورك."
      : `اختر لاعبًا ليسكت في النقاش التالي. يمكنك اختيار نفسك. الاستخدامات المتبقية: ${2 - silent.uses}`;

  state.currentAction = "silent";
  state.selectedTarget = null;

  $("confirmActionBtn")?.classList.add("hidden");
  $("skipActionBtn")?.classList.add("hidden");

  if (silent.uses >= 2) {

    $("actionTargets").innerHTML = `
      <div class="hint">
        استُخدمت قدرة الصامت مرتين.
      </div>
    `;

    $("skipActionBtn")?.classList.remove("hidden");

    return;

  }

  /* جميع الأحياء متاحون، بما فيهم الصامت نفسه. */
  renderTargets(alivePlayers(), true);

}


function selectSilentTarget(event) {

  if (state.currentPlayer?.role !== "silent") {
    return;
  }

  event.preventDefault();
  event.stopImmediatePropagation();

  const silent = state.currentPlayer;

  showActionForPlayer(silent);
  setupSilentAction(silent);

}


function confirmSilentTarget(event) {

  if (state.currentAction !== "silent") {
    return;
  }

  event.preventDefault();
  event.stopImmediatePropagation();

  if (state.actionLocked) {
    return;
  }

  const silentPlayer = state.currentPlayer;
  const silent = silentPlayer && getSilentState(silentPlayer);

  if (!silentPlayer || !silentPlayer.alive || !silent) {
    return;
  }

  if (silent.uses >= 2) {
    showToast("استخدمت قدرة الصامت مرتين.", "error");
    return;
  }

  const target = getPlayer(state.selectedTarget);

  if (!target || !target.alive) {
    showToast("اختر لاعبًا متاحًا أولًا.", "error");
    return;
  }

  state.actionLocked = true;
  $("confirmActionBtn")?.setAttribute("disabled", "disabled");

  silent.uses += 1;

  if (!state.silencedPlayers) {
    state.silencedPlayers = [];
  }

  state.silencedPlayers.push({
    playerId: target.id,
    night: state.night
  });

  state.selectedTarget = null;
  finishNightTurn();

}


function getSilencedPlayersForDiscussion() {

  const ids = [
    ...new Set(
      (state.silencedPlayers || [])
        .filter(entry => entry.night === state.night)
        .map(entry => entry.playerId)
    )
  ];

  return ids
    .map(id => getPlayer(id))
    .filter(player => player?.alive);

}


/* رسالة عامة في النقاش، لأن اللعبة لا تملك محادثة صوتية داخلية لمنع الكلام فعليًا. */
function startDiscussionWithSilence(event) {

  event.preventDefault();
  event.stopImmediatePropagation();

  clearInterval(state.discussionInterval);
  state.discussionInterval = null;
  state.discussionSeconds = 120;

  updateTimer();
  showScreen("discussionScreen");

  const beginTimer = () => {

    state.discussionInterval = setInterval(() => {

      state.discussionSeconds--;
      updateTimer();

      if (state.discussionSeconds <= 0) {

        clearInterval(state.discussionInterval);
        state.discussionInterval = null;

        showToast("انتهى وقت النقاش", "error");
        startVoting();

      }

    }, 1000);

  };

  const silencedPlayers = getSilencedPlayersForDiscussion();

  if (silencedPlayers.length === 0) {
    beginTimer();
    return;
  }

  const names = silencedPlayers
    .map(player => escapeHTML(player.name))
    .join("، ");

  showModal(
    "🤐 قرار الصامت",
    `${names} ممنوع من الكلام حتى نهاية هذا النقاش.`,
    "🤐",
    beginTimer,
    true
  );

}


function addSilentRoleToSetup() {

  const options = $("roleOptions");

  if (!options || options.querySelector('[data-role="silent"]')) {
    return;
  }

  options.insertAdjacentHTML("beforeend", `
    <button class="role-option active" data-role="silent" type="button">
      <div class="role-option-glow"></div>
      <div class="role-option-icon">🤐</div>
      <div class="role-option-info">
        <strong>الصامت</strong>
        <small></small>
      </div>
      <div class="role-power">
        <span>متاح</span>
        <i class="power-light"></i>
      </div>
    </button>
  `);

  renderRoleOptions();

}


function installSilentRole() {

  addSilentRoleToSetup();

  $("continueRoleBtn")?.addEventListener(
    "click",
    selectSilentTarget,
    true
  );

  $("confirmActionBtn")?.addEventListener(
    "click",
    confirmSilentTarget,
    true
  );

  $("startDiscussionBtn")?.addEventListener(
    "click",
    startDiscussionWithSilence,
    true
  );

  $("startGameBtn")?.addEventListener(
    "click",
    () => {
      state.silentStates = {};
      state.silencedPlayers = [];
    },
    true
  );

}


if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", installSilentRole);
} else {
  installSilentRole();
}
/* =========================================================
   فرق المرتزقة والقرية + موازنة التوزيع
   الصق هذا الكود كاملًا في آخر ملف JavaScript،
   بعد كود الصامت.
   ========================================================= */


/*
 * عدد أعضاء فريق المرتزقة:
 * 3-5 لاعبين: قاتل واحد.
 * 6+ لاعبين: العدد المعتاد للقتلة، لكن أحدهم يتحول إلى صامت.
 * مثال: 6-7 = قاتل + صامت، و8-13 = قاتلان + صامت.
 */
function getMercenarySlotCount(count) {

  if (count < 6) {
    return 1;
  }

  return getWolfCount(count);

}


/* الفريقان منفصلان في شروط الفوز. */
function getAliveWolves() {

  return alivePlayers().filter(
    player => getRole(player)?.team === "wolves"
  );

}


function getAliveVillagers() {

  return alivePlayers().filter(
    player => getRole(player)?.team === "village"
  );

}


/* لا تبدأ اللعبة إذا كانت الخيارات لا تحتوي على الفريقين. */
function validateRoleSetup() {

  const playerCount = state.players.length;

  if (playerCount < 3) {
    showToast("أضف 3 لاعبين على الأقل أولًا", "error");
    return false;
  }

  if (playerCount > 50) {
    showToast("الحد الأقصى هو 50 لاعبًا", "error");
    return false;
  }

  const selectedRoles = getSelectedRoles();

  const hasMercenaries = selectedRoles.some(
    role => ROLES[role]?.team === "wolves"
  );

  const hasVillage = selectedRoles.some(
    role => ROLES[role]?.team === "village"
  );

  if (!hasMercenaries || !hasVillage) {
    showToast(
      "يجب تفعيل دور واحد على الأقل من فريق المرتزقة ودور واحد من فريق القرية.",
      "error"
    );
    return false;
  }

  return true;

}


/* التوزيع العشوائي المتوازن. */
function buildRandomRoles() {

  const count = state.players.length;
  const selectedRoles = getSelectedRoles();
  const mercenarySlots = Math.min(getMercenarySlotCount(count), count - 1);
  const silentCount = count >= 6 ? 1 : 0;
  const killerCount = mercenarySlots - silentCount;
  const roles = [];

  for (let index = 0; index < killerCount; index++) {
    roles.push("werewolf");
  }

  if (silentCount === 1) {
    roles.push("silent");
  }

  const villageRoles = selectedRoles.filter(
    role => ROLES[role]?.team === "village"
  );

  while (roles.length < count) {

    let totalWeight = 0;

    villageRoles.forEach(role => {
      totalWeight += ROLE_WEIGHTS[role] ?? 1;
    });

    let random = Math.random() * totalWeight;
    let selectedRole = villageRoles[villageRoles.length - 1];

    for (const role of villageRoles) {

      random -= ROLE_WEIGHTS[role] ?? 1;

      if (random <= 0) {
        selectedRole = role;
        break;
      }

    }

    roles.push(selectedRole);

  }

  return shuffle(roles);

}


/* في التوزيع اليدوي نضمن وجود الفريقين ونفس الموازنة. */
function buildManualRoles() {

  const roles = [];

  for (const player of state.players) {

    const role = state.manualRoles[player.id];

    if (!role) {
      showToast(`اختر دور اللاعب ${player.name}`, "error");
      return null;
    }

    if (!state.activeRoles[role]) {
      showToast(`الدور المختار للاعب ${player.name} متوقف`, "error");
      return null;
    }

    roles.push(role);

  }

  const hasMercenaries = roles.some(
    role => ROLES[role]?.team === "wolves"
  );

  const hasVillage = roles.some(
    role => ROLES[role]?.team === "village"
  );

  if (!hasMercenaries || !hasVillage) {
    showToast("يجب أن تحتوي اللعبة على فريق مرتزقة وفريق قرية.", "error");
    return null;
  }

  const expectedMercenaries = getMercenarySlotCount(state.players.length);
  const expectedSilent = state.players.length >= 6 ? 1 : 0;
  const expectedKillers = expectedMercenaries - expectedSilent;
  const killerCount = roles.filter(role => role === "werewolf").length;
  const silentCount = roles.filter(role => role === "silent").length;

  if (killerCount !== expectedKillers || silentCount !== expectedSilent) {
    showToast(
      state.players.length >= 6
        ? `لهذا العدد يجب اختيار ${expectedKillers} قاتل و1 صامت.`
        : "لهذا العدد يجب اختيار قاتل واحد ولا يوجد صامت.",
      "error"
    );
    return null;
  }

  return roles;

}


/* القاتل يرى القاتل الآخر والصامت كأصدقاء ولا يستطيع استهدافهم. */
function setupWolfAction(player) {

  $("actionIcon").textContent = "🔪";
  $("actionTitle").textContent = "اختر ضحية";
  $("actionDescription").textContent =
    "الأشخاص المعلمون بـ«صديقك» هم من فريق المرتزقة ولا يمكن استهدافهم.";

  state.currentAction = "wolf";

  renderTargets(
    alivePlayers().filter(target => target.id !== player.id),
    false
  );

  state.players
    .filter(target =>
      target.alive &&
      target.id !== player.id &&
      getRole(target)?.team === "wolves"
    )
    .forEach(friend => {

      const button = document.querySelector(
        `#actionTargets [data-target-id="${friend.id}"]`
      );

      if (!button) {
        return;
      }

      button.disabled = true;
      button.classList.add("wolf-friend");

      const marker = button.lastElementChild;

      if (marker) {
        marker.className = "wolf-friend-warning";
        marker.textContent = "صديقك";
      }

    });

}


/* يمنع إيقاف الصامت من 6 لاعبين وفوق لأنه جزء من الموازنة الإلزامية. */
function keepSilentRoleRequired(event) {

  const button = event.target.closest('[data-role="silent"]');

  if (!button || state.players.length < 6) {
    return;
  }

  event.preventDefault();
  event.stopImmediatePropagation();

  state.activeRoles.silent = true;
  renderRoleOptions();
  showToast("الصامت إجباري من 6 لاعبين وفوق للموازنة.", "error");

}


/* يفصل بطاقات الإعداد إلى مجموعتين مرئيتين. */
function separateRoleTeams() {

  const options = $("roleOptions");

  if (!options || options.classList.contains("team-role-groups")) {
    return;
  }

  const cards = [
    ...options.querySelectorAll(":scope > .role-option")
  ];

  const mercenaryCards = cards.filter(
    card => ROLES[card.dataset.role]?.team === "wolves"
  );

  const villageCards = cards.filter(
    card => ROLES[card.dataset.role]?.team === "village"
  );

  options.classList.remove("role-options");
  options.classList.add("team-role-groups");
  options.innerHTML = `
    <section class="team-role-group mercenaries">
      <h3 class="role-team-title">🔪 فريق المرتزقة</h3>
      <div id="mercenaryRoleOptions" class="role-options team-role-options"></div>
    </section>
    <section class="team-role-group village">
      <h3 class="role-team-title">🏘️ فريق القرية</h3>
      <div id="villageRoleOptions" class="role-options team-role-options"></div>
    </section>
  `;

  const mercenaryList = $("mercenaryRoleOptions");
  const villageList = $("villageRoleOptions");

  mercenaryCards.forEach(card => mercenaryList.appendChild(card));
  villageCards.forEach(card => villageList.appendChild(card));

  renderRoleOptions();

}


function installMercenaryTeamUpdate() {

  separateRoleTeams();

  $("roleOptions")?.addEventListener(
    "click",
    keepSilentRoleRequired,
    true
  );

}


if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", installMercenaryTeamUpdate);
} else {
  installMercenaryTeamUpdate();
}
/* =========================================================
   نظام ندرة الشخصيات
   الصق هذا الكود كاملًا في آخر ملف JavaScript.
   ========================================================= */


/*
 * الألوان والندرات المتاحة:
 * شائع = أخضر | نادر = أزرق | استثنائي = بنفسجي
 * خرافي = أحمر | أسطوري = أصفر
 */
const RARITY_CONFIG = {
  "شائع": {
    color: "#32d583",
    icon: "●"
  },
  "نادر": {
    color: "#3b9cff",
    icon: "◆"
  },
  "استثنائي": {
    color: "#a855f7",
    icon: "✦"
  },
  "خرافي": {
    color: "#ef4444",
    icon: "✹"
  },
  "أسطوري": {
    color: "#f6d447",
    icon: "★"
  }
};


/*
 * غيّر كلمة الندرة أمام أي دور كما تريد.
 * الكلمات المسموحة: شائع، نادر، استثنائي، خرافي، أسطوري
 */
const ROLE_RARITIES = {
  werewolf: "شائع",
  silent: "شائع",
  samurai: "خرافي",
  doctor: "نادر",
  seer: "أسطوري",
  witch: "خرافي",
  hunter: "نادر",
  phoenix: "خرافي",
  philosopher: "استثنائي",
  trapper: "استثنائي",
  villager: "شائع"
};


function getRoleRarity(roleId) {

  const rarityName = ROLE_RARITIES[roleId] || "شائع";

  return {
    name: rarityName,
    ...RARITY_CONFIG[rarityName]
  };

}


function applyRoleRarities() {

  Object.entries(ROLE_RARITIES).forEach(([roleId, rarityName]) => {

    if (ROLES[roleId]) {
      ROLES[roleId].rarity = rarityName;
    }

  });

  document.querySelectorAll(".role-option").forEach(card => {

    const rarity = getRoleRarity(card.dataset.role);

    if (!rarity.color) {
      return;
    }

    card.classList.add("has-rarity");
    card.style.setProperty("--rarity-color", rarity.color);

    const text = card.querySelector(".role-option-info small");

    if (text) {
      const label = `${rarity.icon} ${rarity.name}`;

      if (text.textContent !== label) {
        text.textContent = label;
      }
    }

  });

}


function showCurrentRoleRarity() {

  const player = state.currentPlayer;

  if (!player || !player.role) {
    return;
  }

  const rarity = getRoleRarity(player.role);

  if (!rarity.color) {
    return;
  }

  let badge = $("roleRarityBadge");

  if (!badge) {

    badge = document.createElement("div");
    badge.id = "roleRarityBadge";
    badge.className = "role-rarity-badge";

    $("roleDescription")?.insertAdjacentElement("afterend", badge);

  }

  badge.style.setProperty("--rarity-color", rarity.color);
  badge.textContent = `${rarity.icon} الندرة: ${rarity.name}`;

}


function installRoleRarities() {

  applyRoleRarities();

  $("revealRoleBtn")?.addEventListener(
    "click",
    showCurrentRoleRarity
  );

  const options = $("roleOptions");

  if (options) {
    new MutationObserver(applyRoleRarities).observe(
      options,
      { childList: true, subtree: true }
    );
  }

}


if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", installRoleRarities);
} else {
  installRoleRarities();
}
/* =========================================================
   ترتيب الشخصيات حسب الندرة
   الصق هذا الكود في آخر ملف JavaScript،
   بعد كود نظام الندرة وتقسيم الفرق.
   ========================================================= */


/* الترتيب من الأعلى إلى الأقل ندرة. */
/* الترتيب من الشائع إلى الأسطوري. */
const RARITY_ORDER = {
  "أسطوري": 1,
  "خرافي": 2,
  "استثنائي": 3,
  "نادر": 4,
  "شائع": 5
};


function sortRoleCardsByRarity() {

  const roleLists = [
    $("mercenaryRoleOptions"),
    $("villageRoleOptions"),
    $("roleOptions")
  ].filter(list => list);

  roleLists.forEach(list => {

    /* إذا كانت الفرق مفصولة، لا نرتب الحاوية الأم. */
    if (list.id === "roleOptions" && $("mercenaryRoleOptions")) {
      return;
    }

    const cards = [
      ...list.querySelectorAll(":scope > .role-option")
    ];

    cards
      .sort((first, second) => {

        const firstRarity =
          RARITY_ORDER[ROLE_RARITIES[first.dataset.role]] || 0;

        const secondRarity =
          RARITY_ORDER[ROLE_RARITIES[second.dataset.role]] || 0;

        if (firstRarity !== secondRarity) {
          return secondRarity - firstRarity;
          return firstRarity - secondRarity;
        }

        const firstName = ROLES[first.dataset.role]?.name || "";
        const secondName = ROLES[second.dataset.role]?.name || "";

        return firstName.localeCompare(secondName, "ar");

      })
      .forEach(card => list.appendChild(card));

  });

}


/* تستخدمها إذا غيّرت الندرة أثناء عمل اللعبة. */
function setRoleRarity(roleId, rarityName) {

  if (!ROLES[roleId] || !RARITY_CONFIG[rarityName]) {
    return;
  }

  ROLE_RARITIES[roleId] = rarityName;
  applyRoleRarities();
  sortRoleCardsByRarity();

}


function installRoleRaritySort() {

  sortRoleCardsByRarity();

}


if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", installRoleRaritySort);
} else {
  installRoleRaritySort();
}
"use strict";

/*
 * إضافة شخصيات المافيا
 * هذا الملف يُحمَّل بعد script.js الأصلي. لا يعدّل المحرك الأصلي مباشرةً،
 * لكنه يضيف الأدوار والقدرات وقواعد الحماية والتصويت في طبقة واحدة.
 */
(function () {
  const ADDON_KEY = "__mafiaNewRoles";

  const ADDED_ROLES = {
    gambler: { name: "المقامر", icon: "🎲", team: "wolves", type: "gambler", rarity: "استثنائي", weight: 12, description: "اختر لاعبًا؛ باحتمال 50% تموت أنت وباحتمال 50% يموت هو." },
    assassin: { name: "السفاح", icon: "🗡️", team: "wolves", type: "assassin", rarity: "أسطوري", weight: 10, description: "مرة واحدة: اجعل هجوم فريق القتلة هذه الليلة يخترق جميع الحمايات." },
    sorcerer: { name: "المشعوذ", icon: "🧪", team: "wolves", type: "sorcerer", rarity: "أسطوري", weight: 10, description: "اختر لاعبين لجرعة سرية. يختار كل واحد الشرب أو الرفض؛ الشارب يموت، وإذا رفضا معًا يموتان معًا." },
    spy: { name: "الجاسوس", icon: "🕵️", team: "wolves", type: "spy", rarity: "نادر", weight: 8, description: "يعرف في كل ليلة أسماء وأدوار أهل القرية الأحياء." },
    commander: { name: "قائد المرتزقة", icon: "🎖️", team: "wolves", type: "commander", rarity: "أسطوري", weight: 7, description: "لكل قدرة استخدام واحد: قتل، تعطيل قدرة، إسكات، أو تعريف دور لاعب." },
    zombie: { name: "الزومبي", icon: "🧟", team: "wolves", type: "zombie", rarity: "استثنائي", weight: 10, description: "مرة واحدة اختر القتل أو تحويل مواطن إلى فريق الشر بلا قدرة." },
    disguised: { name: "المتنكر", icon: "🎭", team: "wolves", type: "disguised", rarity: "نادر", weight: 10, description: "يظهر للعرّاف كدور مواطن عشوائي، وتظهر لك هويتك الوهمية عند كشف دورك." },
    dark_witch: { name: "الساحرة", icon: "🧙‍♀️", team: "wolves", type: "dark_witch", rarity: "خرافي", weight: 10, description: "مرة واحدة حوّل لاعبًا من القرية إلى الشر بلا قدرة." },
    jailer: { name: "السجّان", icon: "⛓️", team: "wolves", type: "jailer", rarity: "نادر", weight: 12, description: "مرة واحدة عطّل قدرة لاعب في الليلة التالية." },
    forger: { name: "المزوّر", icon: "🎭", team: "wolves", type: "forger", rarity: "استثنائي", weight: 10, description: "انقل القناع الوحيد بين الناس؛ العرّاف يرى صاحب القناع قاتلًا." },
    cursed: { name: "الملعون", icon: "☠️", team: "wolves", type: "cursed", rarity: "نادر", weight: 12, description: "إذا أُعدمت، تصبح أصوات من صوّتوا عليك صفرًا في التصويت التالي." },
    raven: { name: "الغراب", icon: "🐦‍⬛", team: "wolves", type: "raven", rarity: "خرافي", weight: 8, description: "أعطِ مواطنًا هدية؛ نتيجتها 20% موت أو حماية أو تعطيل دائم أو سيف أو درع دائم." },
    ghoul: { name: "الغول", icon: "👹", team: "wolves", type: "ghoul", rarity: "نادر", weight: 10, description: "بعد موتك اختر لاعبًا لتزيل عنه كل الحمايات." },
    plague: { name: "الطاعون", icon: "🦠", team: "wolves", type: "plague", rarity: "خرافي", weight: 9, description: "انشر العدوى؛ في الليلة التالية يختار المصاب الموت أو نقل العدوى." },
    twin: { name: "التوأم", icon: "👥", team: "wolves", type: "twin", rarity: "خرافي", weight: 8, description: "اربط نفسك بعضو من فريقك: كلاكما محمي، وإذا مات أحدكما يموت الآخر." },
    resentful: { name: "الحاقد", icon: "😠", team: "wolves", type: "resentful", rarity: "استثنائي", weight: 12, description: "إن أعدمتك القرية، اختر لاعبًا تقتله قبل خروجك." },
    roadblock: { name: "قاطع الطريق", icon: "🚧", team: "wolves", type: "roadblock", rarity: "نادر", weight: 12, description: "اختر لاعبًا؛ لا يملك حق التصويت في التصويت التالي." },
    imp: { name: "العفريت", icon: "👺", team: "wolves", type: "imp", rarity: "استثنائي", weight: 10, description: "اختر لاعبًا؛ إذا مت تفقده حق التصويت دائمًا." },
    thief: { name: "اللص", icon: "🥷", team: "wolves", type: "thief", rarity: "نادر", weight: 12, description: "مرة واحدة اسرق حماية لاعب أو علاج الطبيب لهذه الليلة." },
    viking: { name: "الفايكنغ", icon: "🛡️", team: "wolves", type: "viking", rarity: "خرافي", weight: 9, description: "يجب أن تنجح القرية في التصويت عليك مرتين كي تخرج." },
    ninja: { name: "النينجا", icon: "🥷", team: "wolves", type: "ninja", rarity: "خرافي", weight: 9, description: "لا يُعرف فريقك بالكشف. علّم لاعبًا مرتين في ليلتين لقتله." },
    ghost: { name: "الشبح", icon: "👻", team: "wolves", type: "ghost", rarity: "استثنائي", weight: 9, description: "مرة واحدة سيطر على قدرة مواطن؛ تُعطّل قدرته في تلك الليلة." },
    pirate: { name: "القرصان", icon: "🏴‍☠️", team: "wolves", type: "pirate", rarity: "نادر", weight: 11, description: "اختر لاعبًا؛ عند موتك يُسجن ولا يستعمل قدرته في الليلة التالية." },

    swordsman: { name: "السياف", icon: "⚔️", team: "village", type: "swordsman", rarity: "استثنائي", weight: 9, description: "مرة واحدة اسحب السيف علنًا ثم اقتل لاعبًا ليلًا؛ الضربة تخترق كل الحمايات." },
    merchant: { name: "التاجر", icon: "💰", team: "village", type: "merchant", rarity: "نادر", weight: 12, description: "مرة واحدة بع صوتك؛ يصبح تصويتك بوزنين في التصويت التالي." },
    talkative: { name: "الثرثار", icon: "🗣️", team: "village", type: "talkative", rarity: "نادر", weight: 12, description: "اختر لاعبًا؛ عند موتك ينكشف دوره للجميع." },
    sheikh: { name: "الشيخ", icon: "🕌", team: "village", type: "sheikh", rarity: "استثنائي", weight: 10, description: "مرتان: امنع كل تحويلات المواطنين إلى الشر في هذه الليلة." },
    grave_robber: { name: "لص القبور", icon: "⚰️", team: "village", type: "grave_robber", rarity: "استثنائي", weight: 8, description: "مرة واحدة اسرق قدرة دور ميت. إذا عاد ذلك اللاعب، تبقى قدرته مسروقة." },
    armored: { name: "المدرّع", icon: "🪖", team: "village", type: "armored", rarity: "نادر", weight: 12, description: "أول هجوم ليلي عليك يكسر درعك ولا تموت؛ الهجوم التالي يقتلك." },
    chain_owner: { name: "صاحب السلسلة", icon: "🔗", team: "village", type: "chain_owner", rarity: "استثنائي", weight: 9, description: "اربط لاعبين اثنين كحد أقصى؛ عند موتك يموت الشخص المربوط الحي." },
    seer_apprentice: { name: "طالب عرّاف", icon: "📜", team: "village", type: "seer_apprentice", rarity: "استثنائي", weight: 8, description: "إذا مات العرّاف تصبح عرّافًا وترث معلومات كشفه." },
    spiritualist: { name: "الروحاني", icon: "🕯️", team: "village", type: "spiritualist", rarity: "خرافي", weight: 8, description: "اسأل الأموات ثلاث مرات عن دورهم. بعد السؤال الثالث تُمنع من التصويت والكلام." },
    dreamer: { name: "مفسر الأحلام", icon: "💤", team: "village", type: "dreamer", rarity: "نادر", weight: 11, description: "اختر لاعبًا؛ إذا مات تعرف أسماء القتلة الأحياء." },
    astronomer: { name: "عالم الفلك", icon: "🔭", team: "village", type: "astronomer", rarity: "نادر", weight: 12, description: "اكشف فقط هل اللاعب من فريق الخير أم الشر." },
    prospector: { name: "المنجّم", icon: "⛏️", team: "village", type: "prospector", rarity: "استثنائي", weight: 8, description: "مرة واحدة افحص ميتًا؛ بنسبة 50% تعرف أسماء القتلة." },
    archer: { name: "رامي السهام", icon: "🏹", team: "village", type: "archer", rarity: "استثنائي", weight: 10, description: "علّم هدفًا أولًا، ثم أطلق سهمًا في ليلة لاحقة. سهمان ولا يخترق الحماية." },
    noble_knight: { name: "الفارس النبيل", icon: "🐎", team: "village", type: "noble_knight", rarity: "خرافي", weight: 9, description: "احمِ لاعبًا من هجمات وتحويلات الشر، ولا تستطيع حماية الشخص نفسه مرتين." },
    poet: { name: "الشاعر", icon: "🎼", team: "village", type: "poet", rarity: "نادر", weight: 11, description: "مرة واحدة اجمع الناس ليلًا؛ لا يموت أحد من الهجمات غير الخارقة هذه الليلة." },
    blacksmith: { name: "الحدّاد", icon: "🔨", team: "village", type: "blacksmith", rarity: "خرافي", weight: 7, description: "اصنع سيفًا أو درعًا خلال 3 ليالٍ، ثم أعطه للاعب تختاره." },
    king: { name: "الملك", icon: "👑", team: "village", type: "king", rarity: "أسطوري", weight: 8, description: "يكشف دوره في أول تصويت؛ صوته بوزنين حينها ثم يُمنع من التصويت." },
    prince: { name: "الأمير", icon: "🤴", team: "village", type: "prince", rarity: "أسطوري", weight: 10, description: "صوته بوزنين مرة واحدة، ثم يصبح وزنه صفرًا." },
    investigator: { name: "المحقق", icon: "🕵️‍♂️", team: "village", type: "investigator", rarity: "نادر", weight: 11, description: "اختر شخصين لمعرفة هل هما من الفريق نفسه. الاستخدامات بلا حد." },
    mediator: { name: "الوسيط", icon: "🕊️", team: "village", type: "mediator", rarity: "خرافي", weight: 8, description: "أحيِ ميتًا مرة واحدة؛ يعود فلاحًا، والشرير يعود لدوره بلا قدرة." },
    hermit: { name: "الناسك", icon: "🧙‍♂️", team: "village", type: "hermit", rarity: "خرافي", weight: 9, description: "مرة واحدة اختر قتلًا خارقًا للحماية أو حمايةً من التحويل؛ اختيارك يلغي الآخر." },
    preacher: { name: "الداعية", icon: "📣", team: "village", type: "preacher", rarity: "استثنائي", weight: 9, description: "مرتان: اختر مرتزقًا واحذف قدرته لبقية اللعبة." },
    alchemist: { name: "الخيميائي", icon: "💉", team: "village", type: "alchemist", rarity: "استثنائي", weight: 9, description: "ضع إبرة؛ إذا قُتل هدفك ينجو ثم يموت في صباح الليلة التالية." },
    royal_doctor: { name: "الطبيب الملكي", icon: "👑", team: "village", type: "royal_doctor", rarity: "خرافي", weight: 8, description: "علاجك يحمي ليلتين. لا تعالج غيره حتى يزول، ولا تعيد نفس الشخص؛ تعالج نفسك مرة." },
    sultan: { name: "السلطان", icon: "🫅", team: "village", type: "sultan", rarity: "خرافي", weight: 8, description: "إذا أعدمتك القرية تنجو، لكن تفقد حق التصويت." },
    caesar: { name: "القيصر", icon: "🏛️", team: "village", type: "caesar", rarity: "أسطوري", weight: 10, description: "إذا أُعدمت، تموت لكن أصوات من صوّتوا عليك تصبح صفرًا في التصويت التالي." },
    genie: { name: "المارد", icon: "🧞", team: "village", type: "genie", rarity: "خرافي", weight: 7, description: "مرة واحدة أحيِ ميتًا ثم تموت أنت؛ العائد يصبح فلاحًا." },
    priest: { name: "الكاهن", icon: "⛪", team: "village", type: "priest", rarity: "استثنائي", weight: 9, description: "مرتان توقّع من سيموت ليلًا. إن أصبت، تحصل على صوت إضافي في التصويت التالي." },
    warrior: { name: "المحارب", icon: "⚔️", team: "village", type: "warrior", rarity: "نادر", weight: 11, description: "ينجو من هجوم الليل ثم يموت في صباح الليلة التالية، ويعرف من هاجمه." },
    carpenter: { name: "النجّار", icon: "🪚", team: "village", type: "carpenter", rarity: "استثنائي", weight: 9, description: "اصنع درعًا خشبيًا لنفسك أو رمحًا يقتل هدفًا بعد ليلتين إن لم يكن محميًا." },

    turned: { name: "متحوّل", icon: "🩸", team: "wolves", type: "turned", hidden: true, rarity: "شائع", weight: 0, description: "تحوّلت إلى فريق الشر وفقدت قدرتك الأصلية." }
  };

  function addOn() {
    if (!state[ADDON_KEY]) {
      state[ADDON_KEY] = {
        states: {},
        extraAttacks: [],
        protectionUntil: {},
        noVoteUntil: {},
        permanentNoVote: {},
        zeroVoteUntil: {},
        disabledUntil: {},
        permanentlyDisabled: {},
        masks: {},
        chains: [],
        twinLinks: {},
        deathQueue: [],
        afterDeathDone: {},
        notices: [],
        delayedDeaths: {},
        conversionBlockedNight: null,
        currentNightPrepared: null,
        seen: {},
        dreamTargets: {},
        potions: [],
        potionChoices: {},
        infectionQueue: [],
        blacksmithJobs: {},
        inventory: {},
        voteBonus: {},
        currentVoteWeights: {},
        roleStolen: {},
        revealedPublic: {},
        action: null,
        afterDeathCallback: null
      };
    }
    return state[ADDON_KEY];
  }

  function roleState(player) {
    const addon = addOn();
    if (!addon.states[player.id]) addon.states[player.id] = {};
    return addon.states[player.id];
  }

  function isEvil(player) {
    return getRole(player) && getRole(player).team === "wolves";
  }

  function isDisabled(player) {
    const addon = addOn();
    return !!addon.permanentlyDisabled[player.id] ||
      (addon.disabledUntil[player.id] || 0) >= state.night;
  }

  function addRoleCards() {
    const evilList = $("mercenaryRoleOptions") || $("roleOptions");
    const villageList = $("villageRoleOptions") || $("roleOptions");
    Object.entries(ADDED_ROLES).forEach(function (entry) {
      const id = entry[0];
      const role = entry[1];
      if (role.hidden) {
        ROLES[id] = {
          name: role.name,
          icon: role.icon,
          team: role.team,
          teamName: "فريق القتلة",
          description: role.description
        };
        return;
      }
      ROLES[id] = {
        name: role.name,
        icon: role.icon,
        team: role.team,
        teamName: role.team === "wolves" ? "فريق القتلة" : "فريق القرية",
        description: role.description
      };
      ROLE_WEIGHTS[id] = role.weight;
      if (typeof ROLE_RARITIES !== "undefined") ROLE_RARITIES[id] = role.rarity;
      if (!Object.prototype.hasOwnProperty.call(state.activeRoles, id)) state.activeRoles[id] = false;
      if (document.querySelector('.role-option[data-role="' + id + '"]')) return;
      const card = document.createElement("button");
      card.className = "role-option addon-role";
      card.type = "button";
      card.dataset.role = id;
      card.innerHTML =
        '<div class="role-option-glow"></div>' +
        '<div class="role-option-icon">' + role.icon + '</div>' +
        '<div class="role-option-info"><strong>' + role.name + '</strong><small></small></div>' +
        '<div class="role-power"><span>متوقف</span><i class="power-light"></i></div>';
      (role.team === "wolves" ? evilList : villageList).appendChild(card);
    });
    if (typeof applyRoleRarities === "function") applyRoleRarities();
    if (typeof sortRoleCardsByRarity === "function") sortRoleCardsByRarity();
    if (typeof renderRoleOptions === "function") renderRoleOptions();
  }

  function randomFrom(list) {
    return list[Math.floor(Math.random() * list.length)];
  }

  function setupActionFrame(player, icon, title, description) {
    state.currentPlayer = player;
    state.selectedTarget = null;
    state.actionLocked = false;
    if ($("actionPlayerName")) $("actionPlayerName").textContent = player.name;
    if ($("actionNightNumber")) $("actionNightNumber").textContent = state.night;
    if (typeof updatePlayerAvatars === "function") updatePlayerAvatars();
    $("actionIcon").textContent = icon;
    $("actionTitle").textContent = title;
    $("actionDescription").textContent = description;
    $("confirmActionBtn").classList.add("hidden");
    $("skipActionBtn").classList.add("hidden");
    $("confirmActionBtn").removeAttribute("disabled");
    $("skipActionBtn").removeAttribute("disabled");
    $("actionTargets").innerHTML = "";
  }

  function finishAddonAction() {
    const addon = addOn();
    addon.action = null;
    state.actionLocked = true;
    $("confirmActionBtn").setAttribute("disabled", "disabled");
    finishNightTurn();
  }

  function showSkip(player, text) {
    setupActionFrame(player, getRole(player).icon, getRole(player).name, text);
    state.currentAction = "skip";
    $("skipActionBtn").classList.remove("hidden");
    showScreen("actionScreen");
  }

  function showOptions(player, title, description, choices) {
    setupActionFrame(player, getRole(player).icon, title, description);
    state.currentAction = "addon-options";
    const container = $("actionTargets");
    choices.forEach(function (choice) {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "target-btn";
      button.innerHTML = "<span>" + choice.icon + " " + choice.label + "</span><span>›</span>";
      button.addEventListener("click", function () {
        choice.run();
      });
      container.appendChild(button);
    });
    $("skipActionBtn").classList.remove("hidden");
    showScreen("actionScreen");
  }

  function picker(player, config) {
    setupActionFrame(player, config.icon || getRole(player).icon, config.title, config.description);
    const targets = (config.targets || alivePlayers()).filter(function (target) {
      if (!config.allowSelf && target.id === player.id) return false;
      return true;
    });
    const action = {
      kind: config.kind,
      playerId: player.id,
      targets: [],
      min: config.min || 1,
      max: config.max || 1,
      config: config
    };
    addOn().action = action;
    state.currentAction = "addon:" + config.kind;
    const container = $("actionTargets");
    if (!targets.length) {
      container.innerHTML = '<div class="hint">لا يوجد لاعب مناسب لهذه القدرة.</div>';
      $("skipActionBtn").classList.remove("hidden");
      showScreen("actionScreen");
      return;
    }
    targets.forEach(function (target) {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "target-btn";
      button.dataset.targetId = target.id;
      const avatar = target.avatar
        ? '<img src="' + escapeHTML(target.avatar) + '" alt="" class="target-avatar">'
        : '<span class="target-avatar target-avatar-empty">👤</span>';
      button.innerHTML =
        '<span class="target-player-info">' + avatar + '<span>' +
        escapeHTML(target.name) + '</span></span><span>›</span>';
      button.addEventListener("click", function () {
        if (state.actionLocked) return;
        const index = action.targets.indexOf(target.id);
        if (index >= 0) {
          action.targets.splice(index, 1);
          button.classList.remove("selected");
        } else {
          if (action.targets.length >= action.max) {
            const removed = action.targets.shift();
            const old = container.querySelector('[data-target-id="' + removed + '"]');
            if (old) old.classList.remove("selected");
          }
          action.targets.push(target.id);
          button.classList.add("selected");
        }
        state.selectedTarget = action.targets[0] || null;
        $("confirmActionBtn").classList.toggle("hidden", action.targets.length < action.min);
      });
      container.appendChild(button);
    });
    $("skipActionBtn").classList.toggle("hidden", !config.allowSkip);
    showScreen("actionScreen");
  }

  function revealRoleTo(player, target, mode) {
    const addon = addOn();
    let shown = getRole(target);
    if (mode === "seer") {
      if (target.role === "disguised") {
        const fake = roleState(target).fakeRole || "villager";
        shown = ROLES[fake];
      } else if (addon.masks[target.id]) {
        shown = ROLES.werewolf;
      } else if (target.role === "ninja") {
        shown = { name: "غير معروف", icon: "❓", team: "unknown" };
      }
    }
    addon.seen[player.id] = addon.seen[player.id] || [];
    addon.seen[player.id].push({ targetId: target.id, role: shown.name, night: state.night });
    return shown;
  }

  function showSpyInfo(player) {
    const villagers = alivePlayers().filter(function (target) { return !isEvil(target); });
    const list = villagers.length
      ? villagers.map(function (target) {
          const role = getRole(target);
          return "• " + escapeHTML(target.name) + ": " + role.icon + " " + role.name;
        }).join("<br>")
      : "لا يوجد مواطن حي.";
    showModal("🕵️ معلومات الجاسوس", list, "🕵️", function () {
      finishAddonAction();
    }, true);
  }

  function openAddedRoleAction(player) {
    const role = ADDED_ROLES[player.role];
    if (!role) return false;
    const rs = roleState(player);
    if (isDisabled(player)) {
      showSkip(player, "قدرتك معطلة هذه الليلة.");
      return true;
    }
    if (player.role === "spy") {
      setupActionFrame(player, role.icon, role.name, role.description);
      state.currentAction = "addon-spy";
      showScreen("actionScreen");
      showSpyInfo(player);
      return true;
    }
    if (player.role === "disguised") {
      showSkip(player, "ساعد فريق القتلة في الكلام. هويتك الوهمية تظهر للعرّاف عند كشفك.");
      return true;
    }
    if (player.role === "turned") {
      showSkip(player, "أنت من فريق الشر، لكنك بلا قدرة.");
      return true;
    }
    if (player.role === "armored" || player.role === "viking" || player.role === "sultan" ||
        player.role === "caesar" || player.role === "warrior" || player.role === "farmer" ||
        player.role === "cursed" || player.role === "ghoul" || player.role === "resentful" ||
        player.role === "seer_apprentice") {
      showSkip(player, role.description);
      return true;
    }
    if (player.role === "assassin") {
      if (rs.used) return showSkip(player, "استُخدمت قدرة السفاح.");
      showOptions(player, "السفاح", "اختر استخدام القدرة أو تخطَّ الدور.", [
        { icon: "🗡️", label: "اجعل هجوم القتلة يخترق الحمايات", run: function () {
          addOn().piercingPackNight = state.night; rs.used = true; finishAddonAction();
        }}
      ]);
      return true;
    }
    if (player.role === "commander") {
      rs.used = rs.used || {};
      const choices = [];
      if (!rs.used.kill) choices.push({ icon: "🗡️", label: "قتل لاعب", run: function () {
        picker(player, { kind: "commander-kill", title: "قتل مباشر", description: "اختر لاعبًا لقتله.", allowSelf: false });
      }});
      if (!rs.used.disable) choices.push({ icon: "🚫", label: "تعطيل قدرة", run: function () {
        picker(player, { kind: "commander-disable", title: "تعطيل قدرة", description: "اختر لاعبًا لتعطيل قدرته الليلة القادمة.", allowSelf: false });
      }});
      if (!rs.used.silence) choices.push({ icon: "🤐", label: "تعطيل صوت", run: function () {
        picker(player, { kind: "commander-silence", title: "إسكات لاعب", description: "اختر لاعبًا ليُمنع من الكلام في النقاش القادم.", allowSelf: true });
      }});
      if (!rs.used.identify) choices.push({ icon: "🔮", label: "تعريف شخص", run: function () {
        picker(player, { kind: "commander-identify", title: "تعريف الدور", description: "اختر لاعبًا لمعرفة دوره.", allowSelf: false });
      }});
      if (!choices.length) return showSkip(player, "استخدمت كل قدرات القائد.");
      showOptions(player, "قائد المرتزقة", "كل قدرة متاحة مرة واحدة فقط.", choices);
      return true;
    }
    if (player.role === "zombie") {
      if (rs.used) return showSkip(player, "استخدمت اختيار الزومبي.");
      showOptions(player, "الزومبي", "اختر القتل أو التحويل (مرة واحدة).", [
        { icon: "🗡️", label: "قتل لاعب", run: function () {
          picker(player, { kind: "zombie-kill", title: "هجوم الزومبي", description: "اختر ضحية.", allowSelf: false });
        }},
        { icon: "🩸", label: "تحويل مواطن", run: function () {
          picker(player, { kind: "zombie-convert", title: "تحويل مواطن", description: "اختر لاعبًا من فريق القرية.", allowSelf: false,
            targets: alivePlayers().filter(function (target) { return !isEvil(target); }) });
        }}
      ]);
      return true;
    }
    if (player.role === "sorcerer") {
      picker(player, { kind: "sorcerer", title: "جرعة المشعوذ", description: "اختر لاعبين ليتلقيا الجرعة السرية.", allowSelf: false, min: 2, max: 2 });
      return true;
    }
    if (player.role === "dark_witch" || player.role === "jailer" || player.role === "roadblock" ||
        player.role === "imp" || player.role === "thief" || player.role === "ghost" || player.role === "pirate" ||
        player.role === "gambler" || player.role === "raven" || player.role === "plague" || player.role === "ninja") {
      const oneUse = ["dark_witch", "jailer", "thief", "ghost"].indexOf(player.role) >= 0;
      if (oneUse && rs.used) return showSkip(player, "استُخدمت قدرتك.");
      const config = {
        kind: player.role,
        title: role.name,
        description: role.description,
        allowSelf: player.role === "gambler" || player.role === "raven",
        allowSkip: true
      };
      if (player.role === "dark_witch") config.targets = alivePlayers().filter(function (target) { return !isEvil(target); });
      picker(player, config);
      return true;
    }
    if (player.role === "forger") {
      picker(player, { kind: "forger", title: "نقل القناع", description: "اختر صاحب القناع الجديد. ينتقل القناع من أي شخص سابق.", allowSelf: true, allowSkip: true });
      return true;
    }
    if (player.role === "twin") {
      if (rs.linked) return showSkip(player, "أنت مرتبط بالفعل بتوأمك.");
      picker(player, { kind: "twin", title: "ربط التوأم", description: "اختر عضوًا حيًا من فريق القتلة لربطكما.", allowSelf: false,
        targets: alivePlayers().filter(function (target) { return target.id !== player.id && isEvil(target); }) });
      return true;
    }
    if (player.role === "swordsman") {
      if (rs.used) return showSkip(player, "استخدمت السيف.");
      picker(player, { kind: "swordsman", title: "سحب السيف", description: "اختر من تقتله. الضربة تخترق الحمايات ويُعلن السيف صباحًا.", allowSelf: false });
      return true;
    }
    if (player.role === "merchant" || player.role === "sheikh" || player.role === "poet") {
      const limit = player.role === "sheikh" ? 2 : 1;
      if ((rs.used || 0) >= limit) return showSkip(player, "استخدمت قدرتك.");
      if (player.role === "merchant") {
        showOptions(player, "التاجر", "بع صوتك الآن لتحصل على صوتين في التصويت القادم.", [
          { icon: "💰", label: "بيع الصوت", run: function () { rs.used = true; rs.doubleVoteNight = state.night + 1; finishAddonAction(); }}
        ]);
      } else {
        showOptions(player, role.name, role.description, [
          { icon: player.role === "poet" ? "🎼" : "🛡️", label: "استخدام القدرة", run: function () {
            rs.used = (rs.used || 0) + 1;
            if (player.role === "sheikh") addOn().conversionBlockedNight = state.night;
            if (player.role === "poet") addOn().peacefulNight = state.night;
            finishAddonAction();
          }}
        ]);
      }
      return true;
    }
    if (player.role === "talkative" || player.role === "dreamer" || player.role === "noble_knight" ||
        player.role === "alchemist" || player.role === "priest") {
      const limits = { alchemist: 1, priest: 2 };
      if (limits[player.role] && (rs.used || 0) >= limits[player.role]) return showSkip(player, "استخدمت كل الاستخدامات.");
      picker(player, { kind: player.role, title: role.name, description: role.description, allowSelf: player.role === "noble_knight" || player.role === "priest", allowSkip: true,
        targets: player.role === "noble_knight"
          ? alivePlayers().filter(function (target) { return !rs.protected || rs.protected.indexOf(target.id) < 0; })
          : alivePlayers() });
      return true;
    }
    if (player.role === "grave_robber" || player.role === "spiritualist" || player.role === "prospector" ||
        player.role === "mediator" || player.role === "genie") {
      const dead = state.players.filter(function (target) { return !target.alive; });
      const limits = { grave_robber: 1, prospector: 1, mediator: 1, genie: 1, spiritualist: 3 };
      if ((rs.used || 0) >= limits[player.role]) return showSkip(player, "لا توجد استخدامات متبقية.");
      picker(player, { kind: player.role, title: role.name, description: role.description, allowSelf: false, targets: dead, allowSkip: true });
      return true;
    }
    if (player.role === "chain_owner") {
      if ((rs.used || 0) >= 2) return showSkip(player, "استخدمت السلسلتين.");
      picker(player, { kind: "chain_owner", title: "ربط السلسلة", description: "اختر شخصًا؛ إذا مت قبل موته يموت معك.", allowSelf: false, allowSkip: true });
      return true;
    }
    if (player.role === "astronomer") {
      picker(player, { kind: "astronomer", title: "رصد النجوم", description: "اختر لاعبًا لمعرفة فريقه فقط.", allowSelf: false, allowSkip: true });
      return true;
    }
    if (player.role === "archer") {
      if ((rs.arrows || 0) >= 2) return showSkip(player, "انتهت سهامك.");
      const kind = rs.mark ? "archer-fire" : "archer-mark";
      picker(player, { kind: kind, title: rs.mark ? "إطلاق السهم" : "تأشير السهم", description: rs.mark ? "اختر هدف إطلاق السهم." : "اختر لاعبًا لتجهيز سهمك ضده لليلة لاحقة.", allowSelf: false, allowSkip: true });
      return true;
    }
    if (player.role === "blacksmith") {
      const job = addOn().blacksmithJobs[player.id];
      if (job && job.readyNight <= state.night) {
        picker(player, { kind: "blacksmith-give", title: "تسليم الصناعة", description: "اختر من يأخذ " + (job.item === "sword" ? "السيف" : "الدرع") + ".", allowSelf: true });
      } else if (job) {
        return showSkip(player, "الصناعة مستمرة؛ تكتمل في الليلة " + job.readyNight + ".");
      } else {
        showOptions(player, "الحدّاد", "اختر ما تريد صنعه؛ يستغرق 3 ليالٍ.", [
          { icon: "⚔️", label: "صناعة سيف", run: function () { addOn().blacksmithJobs[player.id] = { item: "sword", readyNight: state.night + 3 }; finishAddonAction(); }},
          { icon: "🛡️", label: "صناعة درع", run: function () { addOn().blacksmithJobs[player.id] = { item: "shield", readyNight: state.night + 3 }; finishAddonAction(); }}
        ]);
      }
      return true;
    }
    if (player.role === "investigator") {
      picker(player, { kind: "investigator", title: "تحقيق الفريق", description: "اختر شخصين لمعرفة إن كانا في الفريق نفسه.", allowSelf: false, min: 2, max: 2, allowSkip: true });
      return true;
    }
    if (player.role === "hermit") {
      if (rs.used) return showSkip(player, "اخترت طريقك سابقًا.");
      showOptions(player, "الناسك", "اختر واحدة فقط؛ ستفقد الأخرى.", [
        { icon: "⚔️", label: "قتل خارق للحماية", run: function () { picker(player, { kind: "hermit-kill", title: "ضربة الناسك", description: "اختر لاعبًا لقتله مهما كانت حمايته.", allowSelf: false }); }},
        { icon: "🛡️", label: "حماية من التحويل", run: function () { picker(player, { kind: "hermit-protect", title: "حماية الناسك", description: "اختر لاعبًا لحمايته من التحويل.", allowSelf: true }); }}
      ]);
      return true;
    }
    if (player.role === "preacher") {
      if ((rs.used || 0) >= 2) return showSkip(player, "استخدمت الدعوة مرتين.");
      picker(player, { kind: "preacher", title: "الداعية", description: "اختر لاعبًا من فريق الشر لتعطيل قدرته دائمًا.", allowSelf: false,
        targets: alivePlayers().filter(function (target) { return isEvil(target); }), allowSkip: true });
      return true;
    }
    if (player.role === "royal_doctor") {
      if (rs.busyUntil && rs.busyUntil >= state.night) return showSkip(player, "العلاج مستمر ولا يمكنك اختيار أحد حتى يزول.");
      picker(player, { kind: "royal_doctor", title: "العلاج الملكي", description: "اختر من تحميه ليلتين. لا تعيد نفس اللاعب؛ لنفسك مرة.", allowSelf: !rs.selfUsed, allowSkip: true,
        targets: alivePlayers().filter(function (target) { return !rs.treated || rs.treated.indexOf(target.id) < 0; }) });
      return true;
    }
    if (player.role === "carpenter") {
      if (rs.used) return showSkip(player, "استُخدمت صناعة النجار.");
      showOptions(player, "النجّار", "اختر صناعة واحدة.", [
        { icon: "🛡️", label: "درع خشبي لنفسي", run: function () { rs.used = true; rs.woodShield = true; finishAddonAction(); }},
        { icon: "🗡️", label: "رمح مؤجل", run: function () { picker(player, { kind: "carpenter-spear", title: "رمي الرمح", description: "اختر هدفًا؛ يصله الرمح بعد ليلتين إذا لم يكن محميًا.", allowSelf: false }); }}
      ]);
      return true;
    }
    return false;
  }

  function openAction(player) {
    const addon = addOn();
    const inventory = addon.inventory[player.id] || {};
    if (inventory.sword && !addon.ignoreItemFor) {
      showOptions(player, "سيف جاهز", "لديك سيف. اختر استعماله الآن أو متابعة قدرتك الأصلية.", [
        { icon: "⚔️", label: "استعمال السيف", run: function () {
          picker(player, { kind: "item-sword", title: "ضربة السيف", description: "اختر لاعبًا؛ السيف يخترق جميع الحمايات.", allowSelf: false });
        }},
        { icon: getRole(player).icon, label: "استخدام دوري الأصلي", run: function () {
          addon.ignoreItemFor = player.id;
          openAction(player);
          addon.ignoreItemFor = null;
        }}
      ]);
      return;
    }
    if (player && openAddedRoleAction(player)) return;
    baseShowActionForPlayer(player);
  }

  const baseShowActionForPlayer = window.showActionForPlayer;
  const baseBeginNight = window.beginNight;
  const baseResolveNight = window.resolveNight;
  const baseFinishNightResult = window.finishNightResult;
  const baseStartDiscussion = window.startDiscussion;
  const baseContinueAfterVote = window.continueAfterVote;
  const baseStartGame = window.startGame;
  const baseNewGame = window.newGame;

  window.showActionForPlayer = openAction;

  function commitCustomAction() {
    const addon = addOn();
    const action = addon.action;
    if (!action || state.actionLocked) return false;
    const player = getPlayer(action.playerId);
    if (!player) return true;
    if (action.targets.length < action.min) {
      showToast("اختر الهدف المطلوب أولًا.", "error");
      return true;
    }
    const targets = action.targets.map(getPlayer).filter(Boolean);
    const target = targets[0];
    const rs = roleState(player);
    state.actionLocked = true;

    switch (action.kind) {
      case "gambler":
        addon.extraAttacks.push({ targetId: Math.random() < 0.5 ? player.id : target.id, source: "المقامر", pierce: true });
        addon.notices.push("🎲 المقامر لعب حظه هذه الليلة.");
        break;
      case "commander-kill": addon.extraAttacks.push({ targetId: target.id, source: "قائد المرتزقة", pierce: false }); rs.used.kill = true; break;
      case "commander-disable": addon.disabledUntil[target.id] = state.night + 1; rs.used.disable = true; break;
      case "commander-silence": addon.silencedUntil = addon.silencedUntil || {}; addon.silencedUntil[target.id] = state.night; rs.used.silence = true; break;
      case "commander-identify":
        rs.used.identify = true;
        showModal("🎖️ تعريف الشخص", escapeHTML(target.name) + " دوره: " + getRole(target).icon + " " + getRole(target).name, "🎖️", finishAddonAction, true);
        return true;
      case "zombie-kill": addon.extraAttacks.push({ targetId: target.id, source: "الزومبي", pierce: false }); rs.used = true; break;
      case "zombie-convert": addon.conversions = addon.conversions || []; addon.conversions.push({ targetId: target.id, source: "الزومبي" }); rs.used = true; break;
      case "sorcerer": addon.potions.push({ targets: targets.map(function (p) { return p.id; }), ready: false }); break;
      case "dark_witch": addon.conversions = addon.conversions || []; addon.conversions.push({ targetId: target.id, source: "الساحرة" }); rs.used = true; break;
      case "jailer": addon.disabledUntil[target.id] = state.night + 1; rs.used = true; break;
      case "forger": addon.masks = {}; addon.masks[target.id] = true; break;
      case "roadblock": addon.noVoteUntil[target.id] = state.night + 1; break;
      case "imp": rs.targetId = target.id; break;
      case "thief":
        addon.stolenProtectionNight = addon.stolenProtectionNight || {};
        addon.stolenProtectionNight[target.id] = state.night;
        if (state.doctorTarget === target.id) state.doctorTarget = null;
        rs.used = true;
        break;
      case "ghost": addon.disabledUntil[target.id] = state.night; rs.used = true; break;
      case "pirate": rs.targetId = target.id; break;
      case "raven":
        const gift = randomFrom(["death", "shield", "disabled", "sword", "armor"]);
        if (gift === "death") addon.extraAttacks.push({ targetId: target.id, source: "هدية الغراب", pierce: true });
        if (gift === "shield") addon.protectionUntil[target.id] = Math.max(addon.protectionUntil[target.id] || 0, state.night);
        if (gift === "disabled") addon.permanentlyDisabled[target.id] = true;
        if (gift === "sword") { addon.inventory[target.id] = addon.inventory[target.id] || {}; addon.inventory[target.id].sword = true; }
        if (gift === "armor") { addon.inventory[target.id] = addon.inventory[target.id] || {}; addon.inventory[target.id].armor = true; }
        addon.notices.push("🐦‍⬛ هدية الغراب لـ" + escapeHTML(target.name) + ": " +
          ({ death: "موت", shield: "حماية", disabled: "تعطيل دائم", sword: "سيف", armor: "درع دائم" })[gift] + ".");
        break;
      case "plague": addon.infectionQueue.push({ targetId: target.id, phase: "new" }); break;
      case "ninja":
        rs.marks = rs.marks || {};
        rs.marks[target.id] = (rs.marks[target.id] || 0) + 1;
        if (rs.marks[target.id] >= 2) { addon.extraAttacks.push({ targetId: target.id, source: "النينجا", pierce: true }); delete rs.marks[target.id]; }
        break;
      case "twin": addon.twinLinks[player.id] = target.id; addon.twinLinks[target.id] = player.id; rs.linked = true; break;
      case "swordsman": addon.extraAttacks.push({ targetId: target.id, source: "السياف", pierce: true }); rs.used = true; addon.notices.push("⚔️ سُحب السيف هذه الليلة."); break;
      case "item-sword":
        addon.extraAttacks.push({ targetId: target.id, source: "سيف الحدّاد", pierce: true });
        delete addon.inventory[player.id].sword;
        addon.notices.push("⚔️ استُخدم سيف مُهدى هذه الليلة.");
        break;
      case "talkative": rs.targetId = target.id; break;
      case "dreamer": addon.dreamTargets[player.id] = target.id; break;
      case "noble_knight":
        rs.protected = rs.protected || [];
        rs.protected.push(target.id);
        addon.protectionUntil[target.id] = Math.max(addon.protectionUntil[target.id] || 0, state.night);
        addon.noConvertUntil = addon.noConvertUntil || {};
        addon.noConvertUntil[target.id] = Math.max(addon.noConvertUntil[target.id] || 0, state.night);
        break;
      case "alchemist": addon.alchemistTargets = addon.alchemistTargets || {}; addon.alchemistTargets[target.id] = state.night; rs.used = (rs.used || 0) + 1; break;
      case "priest": addon.priestPredictions = addon.priestPredictions || []; addon.priestPredictions.push({ ownerId: player.id, targetId: target.id, night: state.night }); rs.used = (rs.used || 0) + 1; break;
      case "grave_robber": addon.roleStolen[target.id] = player.id; rs.stolenRole = target.role; rs.used = 1; addon.notices.push("⚰️ لص القبور سرق قدرة دور ميت."); break;
      case "spiritualist":
        rs.used = (rs.used || 0) + 1;
        if (rs.used >= 3) { addon.permanentNoVote[player.id] = true; addon.silencedPermanent = addon.silencedPermanent || {}; addon.silencedPermanent[player.id] = true; }
        showModal("🕯️ جواب الروح", escapeHTML(target.name) + " كان دوره: " + getRole(target).icon + " " + getRole(target).name, "🕯️", finishAddonAction, true);
        return true;
      case "prospector":
        rs.used = 1;
        showModal("⛏️ نتيجة المنجّم", Math.random() < 0.5 ? "لم تحصل على جواب هذه المرة." :
          "القتلة الأحياء: " + alivePlayers().filter(isEvil).map(function (p) { return escapeHTML(p.name); }).join("، "), "⛏️", finishAddonAction, true);
        return true;
      case "mediator":
        rs.used = 1; target.alive = true;
        if (isEvil(target)) addon.permanentlyDisabled[target.id] = true;
        else target.role = "villager";
        addon.notices.push("🕊️ عاد " + escapeHTML(target.name) + " إلى الحياة.");
        break;
      case "genie":
        rs.used = 1; target.alive = true; target.role = "villager";
        player.alive = false; addon.notices.push("🧞 ضحّى المارد بنفسه لإحياء " + escapeHTML(target.name) + ".");
        break;
      case "chain_owner": addon.chains.push({ ownerId: player.id, targetId: target.id, active: true }); rs.used = (rs.used || 0) + 1; break;
      case "astronomer":
        showModal("🔭 نتيجة الرصد", escapeHTML(target.name) + " من فريق " + (isEvil(target) ? "الشر" : "الخير") + " فقط.", "🔭", finishAddonAction, true);
        return true;
      case "archer-mark": rs.mark = target.id; break;
      case "archer-fire": addon.extraAttacks.push({ targetId: target.id, source: "سهم رامي السهام", pierce: false }); rs.arrows = (rs.arrows || 0) + 1; rs.mark = null; break;
      case "blacksmith-give":
        const job = addon.blacksmithJobs[player.id];
        addon.inventory[target.id] = addon.inventory[target.id] || {};
        addon.inventory[target.id][job.item] = true;
        delete addon.blacksmithJobs[player.id];
        addon.notices.push("🔨 سلّم الحدّاد " + (job.item === "sword" ? "سيفًا" : "درعًا") + " إلى " + escapeHTML(target.name) + ".");
        break;
      case "investigator":
        const same = isEvil(targets[0]) === isEvil(targets[1]);
        showModal("🕵️ نتيجة التحقيق", escapeHTML(targets[0].name) + " و" + escapeHTML(targets[1].name) + (same ? " من الفريق نفسه." : " ليسا من الفريق نفسه."), "🕵️", finishAddonAction, true);
        return true;
      case "hermit-kill": addon.extraAttacks.push({ targetId: target.id, source: "الناسك", pierce: true }); rs.used = true; break;
      case "hermit-protect": addon.noConvertUntil = addon.noConvertUntil || {}; addon.noConvertUntil[target.id] = 9999; rs.used = true; break;
      case "preacher": addon.permanentlyDisabled[target.id] = true; rs.used = (rs.used || 0) + 1; break;
      case "royal_doctor":
        rs.treated = rs.treated || [];
        rs.treated.push(target.id);
        if (target.id === player.id) rs.selfUsed = true;
        rs.busyUntil = state.night + 1;
        addon.protectionUntil[target.id] = state.night + 1;
        break;
      case "carpenter-spear": rs.used = true; addon.delayedDeaths[state.night + 2] = addon.delayedDeaths[state.night + 2] || []; addon.delayedDeaths[state.night + 2].push({ targetId: target.id, source: "رمح النجار", pierce: false }); break;
      default: break;
    }
    finishAddonAction();
    return true;
  }

  function prepareNight() {
    const addon = addOn();
    addon.currentNightPrepared = state.night;
    if (addon.piercingPackNight === state.night) {
      state.doctorTarget = null;
      state.isGroupPotionActive = false;
      state.nightProtectedPlayers = [];
    }
    if (addon.stolenProtectionNight && addon.stolenProtectionNight[state.doctorTarget] === state.night) {
      state.doctorTarget = null;
    }
    Object.keys(addon.twinLinks).forEach(function (id) {
      const player = getPlayer(id);
      if (player && player.alive) state.nightProtectedPlayers.push(id);
    });
    alivePlayers().forEach(function (player) {
      const rs = roleState(player);
      const inventory = addon.inventory[player.id] || {};
      if (player.role === "armored" && !rs.armorBroken) state.nightProtectedPlayers.push(player.id);
      if (player.role === "warrior" && !rs.hit) state.nightProtectedPlayers.push(player.id);
      if (player.role === "carpenter" && rs.woodShield) state.nightProtectedPlayers.push(player.id);
      if (inventory.armor) state.nightProtectedPlayers.push(player.id);
      if ((addon.protectionUntil[player.id] || 0) >= state.night && !addon.stolenProtectionNight?.[player.id]) state.nightProtectedPlayers.push(player.id);
    });
    if (addon.peacefulNight === state.night) {
      state.nightProtectedPlayers = alivePlayers().map(function (player) { return player.id; });
    } else {
      state.nightProtectedPlayers = Array.from(new Set(state.nightProtectedPlayers));
    }
  }

  function hasProtection(player, pierce) {
    if (pierce) return false;
    const addon = addOn();
    if (addon.peacefulNight === state.night) return true;
    if ((addon.protectionUntil[player.id] || 0) >= state.night && !addon.stolenProtectionNight?.[player.id]) return true;
    const rs = roleState(player);
    const inventory = addon.inventory[player.id] || {};
    if (player.role === "armored" && !rs.armorBroken) return true;
    if (player.role === "warrior" && !rs.hit) return true;
    if (player.role === "carpenter" && rs.woodShield) return true;
    if (inventory.armor) return true;
    return false;
  }

  function markProtectedAttack(player, source) {
    const addon = addOn();
    const rs = roleState(player);
    if (player.role === "armored" && !rs.armorBroken) { rs.armorBroken = true; addon.notices.push("🪖 انكسر درع " + escapeHTML(player.name) + "."); }
    if (player.role === "warrior" && !rs.hit) {
      rs.hit = true;
      addon.delayedDeaths[state.night + 1] = addon.delayedDeaths[state.night + 1] || [];
      addon.delayedDeaths[state.night + 1].push({ targetId: player.id, source: source || "هجوم القتلة", pierce: true });
      addon.notices.push("⚔️ نجا " + escapeHTML(player.name) + " مؤقتًا وسيعرف أن من هاجمه هو " + escapeHTML(source || "القتلة") + ".");
    }
    if (player.role === "carpenter" && rs.woodShield) { rs.woodShield = false; addon.notices.push("🪚 انكسر الدرع الخشبي لـ" + escapeHTML(player.name) + "."); }
    if (addon.inventory[player.id] && addon.inventory[player.id].armor) { delete addon.inventory[player.id].armor; addon.notices.push("🛡️ استُهلك الدرع الدائم لـ" + escapeHTML(player.name) + "."); }
  }

  function applyDeath(player, source, pierce, deaths) {
    if (!player || !player.alive) return false;
    if (hasProtection(player, pierce)) {
      markProtectedAttack(player, source);
      return false;
    }
    if (player.role === "phoenix") handlePhoenixDeath(player);
    else player.alive = false;
    if (deaths.indexOf(player.id) < 0) deaths.push(player.id);
    return true;
  }

  function queueDeathEffects(deadPlayers, context) {
    const addon = addOn();
    deadPlayers.forEach(function (player) {
      if (!player) return;
      if (addon.afterDeathDone[player.id]) return;
      addon.afterDeathDone[player.id] = true;
      const rs = roleState(player);
      if (player.role === "talkative" && rs.targetId) {
        const target = getPlayer(rs.targetId);
        if (target) addon.notices.push("🗣️ كشف الثرثار دور " + escapeHTML(target.name) + ": " + getRole(target).icon + " " + getRole(target).name + ".");
      }
      if (player.role === "ghoul") addon.deathQueue.push({ ownerId: player.id, kind: "ghoul", context: context });
      if (player.role === "imp" && rs.targetId) addon.permanentNoVote[rs.targetId] = true;
      if (player.role === "pirate" && rs.targetId) addon.disabledUntil[rs.targetId] = Math.max(addon.disabledUntil[rs.targetId] || 0, state.night + 1);
      if (player.role === "resentful" && context === "vote") addon.deathQueue.push({ ownerId: player.id, kind: "resentful", context: context });
      addon.chains.forEach(function (chain) {
        if (chain.active && chain.ownerId === player.id) {
          const chained = getPlayer(chain.targetId);
          if (chained && chained.alive) {
            chained.alive = false;
            state.nightDeaths = state.nightDeaths || [];
            if (state.nightDeaths.indexOf(chained.id) < 0) state.nightDeaths.push(chained.id);
            addon.notices.push("🔗 مات " + escapeHTML(chained.name) + " مع صاحب السلسلة.");
          }
        }
      });
      const linkedId = addon.twinLinks[player.id];
      if (linkedId) {
        const linked = getPlayer(linkedId);
        if (linked && linked.alive) {
          linked.alive = false;
          state.nightDeaths = state.nightDeaths || [];
          if (state.nightDeaths.indexOf(linked.id) < 0) state.nightDeaths.push(linked.id);
          addon.notices.push("👥 مات " + escapeHTML(linked.name) + " بسبب رابط التوأم.");
        }
      }
      Object.keys(addon.dreamTargets).forEach(function (dreamerId) {
        if (addon.dreamTargets[dreamerId] === player.id) {
          const dreamer = getPlayer(dreamerId);
          if (dreamer && dreamer.alive) {
            addon.notices.push("💤 عرف مفسر الأحلام القتلة: " +
              alivePlayers().filter(isEvil).map(function (p) { return escapeHTML(p.name); }).join("، "));
          }
        }
      });
      if (player.role === "seer") {
        alivePlayers().filter(function (candidate) { return candidate.role === "seer_apprentice"; }).forEach(function (apprentice) {
          apprentice.role = "seer";
          addon.notices.push("📜 أصبح " + escapeHTML(apprentice.name) + " عرّافًا بعد موت العرّاف.");
        });
      }
    });
  }

  function applyAddonNightEffects() {
    const addon = addOn();
    const deaths = state.nightDeaths || [];
    const initiallyDead = deaths.map(getPlayer).filter(Boolean);
    const wolfTargetIds = Object.values(state.wolfChoices || {});
    wolfTargetIds.forEach(function (id) {
      const target = getPlayer(id);
      if (!target || !target.alive) return;
      if (target.role === "armored" && !roleState(target).armorBroken) markProtectedAttack(target, "القتلة");
      if (target.role === "warrior" && !roleState(target).hit) markProtectedAttack(target, "القتلة");
      if (target.role === "carpenter" && roleState(target).woodShield) markProtectedAttack(target, "القتلة");
    });
    (addon.delayedDeaths[state.night] || []).forEach(function (event) {
      const target = getPlayer(event.targetId);
      applyDeath(target, event.source, event.pierce, deaths);
    });
    delete addon.delayedDeaths[state.night];
    (addon.extraAttacks || []).forEach(function (attack) {
      applyDeath(getPlayer(attack.targetId), attack.source, attack.pierce, deaths);
    });
    addon.extraAttacks = [];
    (addon.conversions || []).forEach(function (conversion) {
      const target = getPlayer(conversion.targetId);
      const block = addon.conversionBlockedNight === state.night ||
        ((addon.noConvertUntil && addon.noConvertUntil[conversion.targetId]) || 0) >= state.night;
      if (target && target.alive && !isEvil(target) && !block) {
        target.originalRole = target.role;
        target.role = "turned";
        addon.notices.push("🩸 تحوّل لاعب إلى فريق الشر.");
      }
    });
    addon.conversions = [];
    (addon.potions || []).filter(function (potion) { return potion.ready; }).forEach(function (potion) {
      const choices = potion.targets.map(function (id) { return addon.potionChoices[id]; });
      const same = choices[0] === choices[1];
      potion.targets.forEach(function (id, index) {
        if (same || choices[index] === "drink") applyDeath(getPlayer(id), "جرعة المشعوذ", true, deaths);
      });
    });
    addon.potions = (addon.potions || []).filter(function (potion) { return !potion.ready; });
    (addon.priestPredictions || []).filter(function (prediction) { return prediction.night === state.night; }).forEach(function (prediction) {
      if (deaths.indexOf(prediction.targetId) >= 0) {
        addon.voteBonus[prediction.ownerId] = (addon.voteBonus[prediction.ownerId] || 0) + 1;
        addon.notices.push("⛪ أصاب الكاهن توقّعه وحصل على صوت إضافي.");
      }
    });
    addon.priestPredictions = (addon.priestPredictions || []).filter(function (prediction) { return prediction.night !== state.night; });
    const finalDead = deaths.map(getPlayer).filter(Boolean);
    queueDeathEffects(finalDead, "night");
    if (addon.notices.length) {
      state.nightAddonNotices = addon.notices.splice(0);
    }
  }

  function beginPotionChoices(next) {
    const addon = addOn();
    const potion = addon.potions.find(function (entry) { return !entry.ready; });
    if (!potion) return next();
    const targets = potion.targets.map(getPlayer).filter(function (p) { return p && p.alive; });
    if (targets.length !== 2) { potion.ready = true; return next(); }
    function ask(index) {
      const target = targets[index];
      setupActionFrame(target, "🧪", "جرعة المشعوذ", "اختر سرًا: هل تشرب الجرعة أم ترفضها؟");
      state.currentAction = "addon-potion-choice";
      $("actionTargets").innerHTML = "";
      ["drink", "refuse"].forEach(function (choice) {
        const button = document.createElement("button");
        button.type = "button";
        button.className = "target-btn";
        button.innerHTML = "<span>" + (choice === "drink" ? "🥤 أشرب الجرعة" : "✋ أرفض الجرعة") + "</span><span>›</span>";
        button.addEventListener("click", function () {
          addon.potionChoices[target.id] = choice;
          if (index + 1 < targets.length) ask(index + 1);
          else {
            potion.ready = true;
            beginPotionChoices(next);
          }
        });
        $("actionTargets").appendChild(button);
      });
      showScreen("actionScreen");
    }
    ask(0);
  }

  window.beginNight = function () {
    const addon = addOn();
    const infection = addon.infectionQueue.find(function (entry) { return entry.phase === "new"; });
    if (infection) {
      const target = getPlayer(infection.targetId);
      infection.phase = "handled";
      if (!target || !target.alive) return window.beginNight();
      setupActionFrame(target, "🦠", "رسالة الطاعون", "أنت مصاب. اختر الموت أو نقل العدوى إلى لاعب آخر.");
      state.currentAction = "addon-infection";
      const container = $("actionTargets");
      const die = document.createElement("button");
      die.type = "button"; die.className = "target-btn";
      die.innerHTML = "<span>☠️ أقتل نفسي</span><span>›</span>";
      die.addEventListener("click", function () {
        addon.delayedDeaths[state.night] = addon.delayedDeaths[state.night] || [];
        addon.delayedDeaths[state.night].push({ targetId: target.id, source: "الطاعون", pierce: true });
        baseBeginNight();
      });
      const spread = document.createElement("button");
      spread.type = "button"; spread.className = "target-btn";
      spread.innerHTML = "<span>🦠 أنقل العدوى</span><span>›</span>";
      spread.addEventListener("click", function () {
        picker(target, { kind: "infection-spread", title: "نقل العدوى", description: "اختر شخصًا آخر لإصابته.", allowSelf: false,
          targets: alivePlayers().filter(function (p) { return p.id !== target.id; }) });
      });
      container.append(die, spread);
      showScreen("actionScreen");
      return;
    }
    baseBeginNight();
  };

  window.resolveNight = function () {
    const addon = addOn();
    beginPotionChoices(function () {
      prepareNight();
      baseResolveNight();
    });
  };

  window.finishNightResult = function () {
    applyAddonNightEffects();
    const addon = addOn();
    const oldText = $("nightResultText").innerHTML;
    baseFinishNightResult();
    if (state.nightAddonNotices && state.nightAddonNotices.length && $("nightResultText")) {
      $("nightResultText").innerHTML += "<br><br><div class=\"addon-notices\">" + state.nightAddonNotices.join("<br>") + "</div>";
      state.nightAddonNotices = [];
    }
  };

  function showDeathAbility(next) {
    const addon = addOn();
    const item = addon.deathQueue.shift();
    if (!item) { next(); return; }
    const owner = getPlayer(item.ownerId);
    if (!owner) { showDeathAbility(next); return; }
    const kind = item.kind;
    picker(owner, {
      kind: "after-" + kind,
      title: kind === "ghoul" ? "قدرة الغول بعد الموت" : "قدرة الحاقد قبل الخروج",
      description: kind === "ghoul" ? "اختر لاعبًا لإزالة كل حماياته." : "اختر لاعبًا لقتله قبل خروجك.",
      allowSelf: false,
      targets: alivePlayers()
    });
    addon.afterDeathCallback = function () { showDeathAbility(next); };
  }

  function startDiscussionExt() {
    const addon = addOn();
    const continueDiscussion = function () {
      const silenced = alivePlayers().filter(function (player) {
        return (addon.silencedUntil && addon.silencedUntil[player.id] === state.night) ||
          (addon.silencedPermanent && addon.silencedPermanent[player.id]);
      });
      if (silenced.length) {
        showModal("🤐 منع الكلام", silenced.map(function (p) { return escapeHTML(p.name); }).join("، ") + " ممنوع من الكلام خلال هذا النقاش.", "🤐", baseStartDiscussion, true);
      } else baseStartDiscussion();
    };
    if (addon.deathQueue.length) showDeathAbility(continueDiscussion);
    else continueDiscussion();
  }

  function voteWeight(voter) {
    const addon = addOn();
    if ((addon.zeroVoteUntil[voter.id] || 0) >= state.night) return 0;
    let weight = 1 + (addon.voteBonus[voter.id] || 0);
    const rs = roleState(voter);
    if (voter.role === "merchant" && rs.doubleVoteNight === state.night) weight = 2;
    if (voter.role === "king" && !rs.voteUsed) weight = 2;
    if (voter.role === "prince" && !rs.voteUsed) weight = 2;
    return weight;
  }

  function canVote(voter) {
    const addon = addOn();
    return voter.alive && !addon.permanentNoVote[voter.id] &&
      (addon.noVoteUntil[voter.id] || 0) < state.night;
  }

  function renderVotingTargetsExt(voter) {
    const container = $("votingTargets");
    const addon = addOn();
    const targets = alivePlayers().filter(function (player) { return player.id !== voter.id; });
    let challenge = "";
    if (voter.role === "farmer") {
      const first = 2 + Math.floor(Math.random() * 8);
      const second = 1 + Math.floor(Math.random() * 8);
      addon.farmerQuestion = { voterId: voter.id, answer: first + second };
      challenge = '<label class="farm-challenge">🌾 احسب ' + first + " + " + second +
        ': <input id="farmerAnswer" inputmode="numeric" type="number"></label>';
    }
    container.innerHTML = challenge + targets.map(function (player) {
      const avatar = player.avatar
        ? '<img src="' + escapeHTML(player.avatar) + '" alt="" class="target-avatar">'
        : '<span class="target-avatar target-avatar-empty">👤</span>';
      return '<button class="target-btn" data-vote-id="' + player.id + '" type="button"><span class="target-player-info">' +
        avatar + "<span>" + escapeHTML(player.name) + "</span></span><span>🗳️</span></button>";
    }).join("") + '<button class="target-btn" data-vote-id="SKIP" type="button"><span>⏭️ تخطي التصويت</span><span>—</span></button>';
    container.onclick = function (event) {
      const button = event.target.closest(".target-btn");
      if (!button || state.voteLocked) return;
      container.querySelectorAll(".target-btn").forEach(function (b) { b.classList.remove("selected"); });
      button.classList.add("selected");
      state.selectedVote = button.dataset.voteId;
      $("confirmVoteBtn").classList.remove("hidden");
    };
  }

  function startVotingExt() {
    clearInterval(state.discussionInterval);
    state.discussionInterval = null;
    state.votingOrder = alivePlayers().filter(canVote);
    state.votingIndex = 0;
    state.votes = {};
    state.selectedVote = null;
    state.votingResolved = false;
    state.voteLocked = false;
    if (!state.votingOrder.length) {
      $("voteResultText").innerHTML = "⚖️ لا يملك أي لاعب حي حق التصويت في هذه الجولة.";
      showScreen("voteResultScreen");
      return;
    }
    showNextVoterExt();
  }

  function showNextVoterExt() {
    if (state.votingIndex >= state.votingOrder.length) { resolveVotesExt(); return; }
    const voter = state.votingOrder[state.votingIndex];
    state.currentPlayer = voter;
    state.selectedVote = null;
    state.voteLocked = false;
    $("votingPlayerName").textContent = voter.name;
    setAvatarElement($("votingPlayerAvatar"), voter);
    renderVotingTargetsExt(voter);
    $("confirmVoteBtn").classList.add("hidden");
    $("confirmVoteBtn").removeAttribute("disabled");
    showScreen("votingScreen");
  }

  function confirmVoteExt() {
    if (state.voteLocked || !state.selectedVote) return;
    const voter = state.currentPlayer;
    if (!voter || !canVote(voter)) return;
    const addon = addOn();
    if (voter.role === "farmer") {
      const answer = Number($("farmerAnswer") && $("farmerAnswer").value);
      if (answer !== addon.farmerQuestion.answer) {
        showToast("حل العملية أولًا ليُحتسب تصويت الفلاح.", "error");
        return;
      }
    }
    if (state.selectedVote !== "SKIP") {
      const target = getPlayer(state.selectedVote);
      if (!target || !target.alive || target.id === voter.id) { showToast("هذا الهدف غير متاح.", "error"); return; }
    }
    state.voteLocked = true;
    $("confirmVoteBtn").setAttribute("disabled", "disabled");
    state.votes[voter.id] = { id: state.selectedVote, weight: voteWeight(voter) };
    const rs = roleState(voter);
    if (voter.role === "king" || voter.role === "prince") {
      rs.voteUsed = true;
      addon.permanentNoVote[voter.id] = true;
      if (voter.role === "king" && !addon.revealedPublic[voter.id]) {
        addon.revealedPublic[voter.id] = true;
        showToast("👑 انكشف الملك للجميع وصوته بوزنين هذه الجولة.", "success");
      }
    }
    delete addon.voteBonus[voter.id];
    audioSystem.playVotingSound();
    state.votingIndex++;
    if (state.votingIndex >= state.votingOrder.length) resolveVotesExt();
    else showPassScreen(state.votingOrder[state.votingIndex], "voting");
  }

  function resolveVotesExt() {
    state.votingResolved = true;
    const counts = {};
    let skip = 0;
    Object.values(state.votes).forEach(function (vote) {
      if (vote.id === "SKIP") skip += vote.weight;
      else counts[vote.id] = (counts[vote.id] || 0) + vote.weight;
    });
    let eliminatedId = null;
    const highest = Math.max(skip, 0, ...Object.values(counts));
    const winners = Object.keys(counts).filter(function (id) { return counts[id] === highest; });
    if (skip === highest && highest > 0) winners.push("SKIP");
    if (winners.length === 1 && winners[0] !== "SKIP") eliminatedId = winners[0];
    if (!eliminatedId) {
      $("voteResultText").innerHTML = "⚖️ لم يتم إخراج أي لاعب؛ حدث تعادل أو حصل التخطي على أعلى الأصوات.";
      showScreen("voteResultScreen");
      return;
    }
    const eliminated = getPlayer(eliminatedId);
    const addon = addOn();
    if (eliminated.role === "viking") {
      const rs = roleState(eliminated);
      rs.voteMarks = (rs.voteMarks || 0) + 1;
      if (rs.voteMarks < 2) {
        $("voteResultText").innerHTML = "🛡️ صوّتت القرية لإخراج " + escapeHTML(eliminated.name) + "، لكنه الفايكنغ ونجا. يلزم تصويت ناجح ثانٍ.";
        showScreen("voteResultScreen");
        return;
      }
    }
    if (eliminated.role === "sultan") {
      addon.permanentNoVote[eliminated.id] = true;
      $("voteResultText").innerHTML = "🫅 حاولت القرية إعدام " + escapeHTML(eliminated.name) + "، لكنه السلطان ونجا وفقد حق التصويت.";
      showScreen("voteResultScreen");
      return;
    }
    if (eliminated.role === "phoenix") handlePhoenixDeath(eliminated);
    else eliminated.alive = false;
    if (eliminated.role === "cursed" || eliminated.role === "caesar") {
      Object.keys(state.votes).forEach(function (voterId) {
        if (state.votes[voterId].id === eliminated.id) addon.zeroVoteUntil[voterId] = state.night + 1;
      });
    }
    queueDeathEffects([eliminated], "vote");
    if (eliminated.role === "hunter") { state.hunterQueue = [eliminated]; state.hunterMode = "vote"; }
    if (eliminated.role === "samurai") { state.samuraiQueue = [eliminated]; state.samuraiMode = true; }
    let detail = "💀 خرج من اللعبة: <strong>" + escapeHTML(eliminated.name) + "</strong>.";
    if (eliminated.role === "hunter") detail += "<br><br>يستطيع الصياد اختيار لاعب ليخرج معه.";
    if (eliminated.role === "samurai") detail += "<br><br>لديه مبارزة أخيرة.";
    if (eliminated.role === "phoenix") detail += "<br><br>ستعود العنقاء وفق قواعدها.";
    $("voteResultText").innerHTML = detail;
    showScreen("voteResultScreen");
  }

  function finishAfterDeathAction() {
    const addon = addOn();
    const callback = addon.afterDeathCallback;
    addon.afterDeathCallback = null;
    addon.action = null;
    if (callback) callback();
  }

  function handleSpecialConfirm(event) {
    const action = addOn().action;
    if (state.currentAction === "seer" && state.selectedTarget && state.currentPlayer) {
      event.preventDefault(); event.stopImmediatePropagation();
      const player = state.currentPlayer;
      const target = getPlayer(state.selectedTarget);
      if (!target || !target.alive) return;
      const shown = revealRoleTo(player, target, "seer");
      showModal("🔮 كشف العرّاف", escapeHTML(target.name) + " دوره هو: " + shown.icon + " " + shown.name, "🔮", function () {
        state.actionLocked = false; finishNightTurn();
      }, true);
      return;
    }
    if (!action) return;
    event.preventDefault(); event.stopImmediatePropagation();
    if (action.kind === "infection-spread") {
      const target = getPlayer(action.targets[0]);
      if (target) addOn().infectionQueue.push({ targetId: target.id, phase: "new" });
      addOn().action = null;
      baseBeginNight();
      return;
    }
    if (action.kind === "after-ghoul" || action.kind === "after-resentful") {
      const target = getPlayer(action.targets[0]);
      if (target) {
        if (action.kind === "after-ghoul") {
          delete addOn().protectionUntil[target.id];
          delete addOn().noConvertUntil?.[target.id];
          addOn().notices.push("👹 أزال الغول حمايات " + escapeHTML(target.name) + ".");
        } else {
          target.alive = false;
          addOn().notices.push("😠 قتل الحاقد " + escapeHTML(target.name) + " قبل خروجه.");
        }
      }
      finishAfterDeathAction();
      return;
    }
    commitCustomAction();
  }

  function interceptClick(event) {
    const target = event.target.closest && event.target.closest("button");
    if (!target) return;
    if (target.id === "confirmActionBtn") {
      handleSpecialConfirm(event);
      return;
    }
    if (target.id === "skipActionBtn" && addOn().action) {
      event.preventDefault(); event.stopImmediatePropagation();
      addOn().action = null; state.currentAction = "skip"; finishNightTurn();
      return;
    }
    if (target.id === "startDiscussionBtn") {
      event.preventDefault(); event.stopImmediatePropagation();
      startDiscussionExt();
      return;
    }
    if (target.id === "startVotingBtn") {
      event.preventDefault(); event.stopImmediatePropagation();
      startVotingExt();
      return;
    }
    if (target.id === "confirmVoteBtn") {
      event.preventDefault(); event.stopImmediatePropagation();
      confirmVoteExt();
      return;
    }
    if (target.id === "continueAfterVoteBtn" && addOn().deathQueue.length) {
      event.preventDefault(); event.stopImmediatePropagation();
      showDeathAbility(function () {
        if (typeof checkWinner === "function" && checkWinner()) return;
        baseContinueAfterVote();
      });
      return;
    }
    if (target.id === "startGameBtn") {
      event.preventDefault(); event.stopImmediatePropagation();
      state[ADDON_KEY] = null;
      baseStartGame();
      return;
    }
    if (target.id === "newGameBtn") {
      event.preventDefault(); event.stopImmediatePropagation();
      baseNewGame();
      setTimeout(addRoleCards, 0);
    }
  }

  function buildRandomRolesExt() {
    const selected = getSelectedRoles().filter(function (id) { return ROLES[id]; });
    const count = state.players.length;
    const slots = Math.min(typeof getMercenarySlotCount === "function" ? getMercenarySlotCount(count) : getWolfCount(count), count - 1);
    const evil = selected.filter(function (id) { return ROLES[id].team === "wolves" && id !== "turned"; });
    const village = selected.filter(function (id) { return ROLES[id].team === "village"; });
    const roles = ["werewolf"];
    for (let i = 1; i < slots; i++) roles.push(randomFrom(evil.length ? evil : ["werewolf"]));
    while (roles.length < count) roles.push(randomFrom(village.length ? village : ["villager"]));
    return shuffle(roles);
  }

  function buildManualRolesExt() {
    const roles = state.players.map(function (player) { return state.manualRoles[player.id]; });
    if (roles.some(function (role) { return !role || !ROLES[role]; })) {
      showToast("اختر دور كل لاعب أولًا.", "error");
      return null;
    }
    const evil = roles.filter(function (role) { return ROLES[role].team === "wolves"; }).length;
    if (evil < 1 || evil >= roles.length) {
      showToast("يجب أن تضم اللعبة فريق القتلة وفريق القرية.", "error");
      return null;
    }
    return roles;
  }

  window.buildRandomRoles = buildRandomRolesExt;
  window.buildManualRoles = buildManualRolesExt;
  window.startVoting = startVotingExt;
  window.renderVotingTargets = renderVotingTargetsExt;
  window.showNextVoter = showNextVoterExt;

  document.addEventListener("click", function (event) {
    const button = event.target.closest && event.target.closest("#revealRoleBtn");
    const player = state.currentPlayer;
    if (!button || !player || player.role !== "disguised") return;
    const rs = roleState(player);
    if (!rs.fakeRole) {
      const options = Object.keys(ROLES).filter(function (id) {
        return ROLES[id].team === "village" && id !== "turned";
      });
      rs.fakeRole = randomFrom(options.length ? options : ["villager"]);
    }
    setTimeout(function () {
      if ($("roleDescription")) {
        $("roleDescription").textContent =
          getRole(player).description + " هويتك الوهمية للعرّاف: " +
          ROLES[rs.fakeRole].icon + " " + ROLES[rs.fakeRole].name + ".";
      }
    }, 0);
  });

  document.addEventListener("click", interceptClick, true);
  addRoleCards();
})();


