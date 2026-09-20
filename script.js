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
    samurai: true,
    doctor: true,
    seer: true,
    witch: true,
    hunter: true,
    phoenix: true,
    philosopher: true,
    trapper: true,
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


