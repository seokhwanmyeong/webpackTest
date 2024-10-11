class Quize extends Common {
  constructor() {
    super({ key: "Quize" });
    this.choiceBtnAudio = {};
    this.choiceBtnAudioLayer = {};
    this.choiceBtn = {};
    this.slctIdx = null;
    this.choiceCheckbox = {};
  }

  create() {
    super.create();

    //  Component: Btn_Audio_Q
    if (this.template.level === 1) this.addBtnQuestionAudio();

    //  Component: Box_Image
    this.addBoxQuestionImg();

    //  Component: Btn_Choice
    this.addBtnChoice();

    this.initQuiz();
  }

  addBtnQuestionAudio() {
    const styleBtn = this.template.style.audio.question;

    const playAudioButton = this.add
      .image(styleBtn.x, styleBtn.y, "btnQPlayDefault")
      .setDisplaySize(styleBtn.width, styleBtn.height)
      .setOrigin(0, 0)
      .setInteractive();

    playAudioButton.on("pointerdown", () => {
      if (this.currentPlaying === "question") {
        this.stopAudio();
        playAudioButton.setTexture("btnQStopPress");
      } else {
        this.currentPlaying = "question";
        playAudioButton.setTexture("btnQPlayPress");
        this.manageAudio("question", "audioQuestion");
      }
    });
    playAudioButton.on("pointerup", () => {
      this.manageEffect("bgmClick", "effect");

      if (this.currentPlaying) playAudioButton.setTexture("btnQStopDefault");
      else playAudioButton.setTexture("btnQPlayDefault");
    });

    this.audioBtnQ = playAudioButton;
  }

  addBoxQuestionImg() {
    const styleCard = this.template.style.card.question;

    const frameQ = this.add
      .image(styleCard.x, styleCard.y, "frame1")
      .setDisplaySize(styleCard.width, styleCard.height)
      .setOrigin(0, 0);
    let graphics = this.add.graphics();
    graphics.fillRoundedRect(
      styleCard.img.x,
      styleCard.img.y,
      styleCard.img.width,
      styleCard.img.height,
      styleCard.radius
    );
    let mask = graphics.createGeometryMask();
    let imgQ = this.add
      .image(
        styleCard.img.x + styleCard.img.width / 2,
        styleCard.img.y + styleCard.img.height / 2,
        `question`
      )
      .setOrigin(0.5, 0.5);
    if (imgQ.width > imgQ.height) {
      const ratio = styleCard.img.width / imgQ.width;
      imgQ.setDisplaySize(
        imgQ.width > styleCard.img.width
          ? styleCard.img.width
          : imgQ.width * ratio,
        imgQ.height * ratio
      );
    } else {
      const ratio = styleCard.img.height / imgQ.height;
      imgQ.setDisplaySize(
        imgQ.width * ratio,
        imgQ.height > styleCard.img.height
          ? styleCard.img.height
          : imgQ.height * ratio
      );
    }
    imgQ.setMask(mask);
  }

  addCheckbox(x, y) {
    const styleCheckBox = this.template.style.btnCheckBox;
    const checkBox = this.add
      .image(x, y, "btnCheckBoxDefault")
      .setDisplaySize(styleCheckBox.width, styleCheckBox.height)
      .setOrigin(0.5, 0.5)
      .setDepth(1)
      .setInteractive();

    return checkBox;
  }

  addBtnChoice() {
    const choices = this.template?.choice;
    const styleBtnChoice = this.template.style.card.choice;

    choices.forEach((choice, idx) => {
      const style = styleBtnChoice[idx];
      const btnChoice = this.add
        .image(style.x, style.y, `btnChoice${idx + 1}`)
        .setDisplaySize(style.width, style.height)
        .setOrigin(0, 0)
        .setInteractive();
      const center = btnChoice.getCenter();
      const checkBox = this.addCheckbox(
        center.x + (style.checkbox?.x || 0),
        btnChoice.y + (style.checkbox?.y || 0)
      );
      const btnAudioChoice = this.add
        .image(
          center.x + (style.audio?.x || 0),
          center.y + (style.audio?.y || 0),
          "btnCPlay"
        )
        .setDisplaySize(style.audio.width, style.audio.height);
      const centerAudio = btnAudioChoice.getCenter();
      const btnAudioChoiceLayer = this.add
        .rectangle(
          centerAudio.x,
          centerAudio.y,
          btnAudioChoice.displayWidth * 0.77,
          btnAudioChoice.displayWidth * 0.77,
          0x000000,
          0
        )
        .setInteractive();

      btnAudioChoiceLayer.on("pointerdown", () => {
        if (this.currentPlaying === `choice${idx + 1}`) {
          btnAudioChoice.setTexture("btnCPlay");
          this.stopAudio();
        } else {
          btnAudioChoice.setTexture("btnCStop");
          this.manageAudio(`choice${idx + 1}`, `audioChoice`);
        }
      });
      btnAudioChoiceLayer.on("pointerup", () => {
        this.manageEffect("bgmClick", "effect");
      });

      btnChoice.on("pointerdown", () => {
        if (!this.check) {
          const isReady =
            this.template.level === 1
              ? this.groupSounds?.audioChoice?.[`choice${idx + 1}`] &&
                this.groupSounds?.audioQuestion
              : this.groupSounds?.audioChoice?.[`choice${idx + 1}`];

          if (isReady) {
            if (this.slctIdx !== undefined || this.slctIdx !== null) {
              this.resetChoice();
            }

            this.manageEffect("bgmClick", "effect");
            checkBox.setTexture("btnCheckBoxPress");
            this.selectAnswer(idx, choice.value, false, false);
          } else if (!isReady) {
            this.showDialog("dialog");
          }
        }
      });
      checkBox.on("pointerdown", () => {
        if (!this.check) {
          const isReady =
            this.template.level === 1
              ? this.groupSounds?.audioChoice?.[`choice${idx + 1}`] &&
                this.groupSounds?.audioQuestion
              : this.groupSounds?.audioChoice?.[`choice${idx + 1}`];

          if (isReady) {
            if (this.slctIdx !== undefined || this.slctIdx !== null) {
              this.resetChoice();
            }

            this.manageEffect("bgmClick", "effect");
            checkBox.setTexture("btnCheckBoxPress");
            this.selectAnswer(idx, choice.value, false, false);
          } else if (!isReady) {
            this.showDialog("dialog");
          }
        }
      });

      this.choiceBtnAudioLayer[`choice${idx + 1}`] = btnAudioChoiceLayer;
      this.choiceBtnAudio[`choice${idx + 1}`] = btnAudioChoice;
      this.choiceBtn[idx] = btnChoice;
      this.choiceCheckbox[idx] = checkBox;
    });
  }

  resetChoice() {
    this.choiceCheckbox &&
      Object.entries(this.choiceCheckbox).map((btn, idx) =>
        btn[1].setTexture("btnCheckBoxDefault")
      );
    this.slctIdx = null;
    this.userAnswer = null;
    this.check = false;
  }

  resetGame() {
    //  button
    this.checkAnswerBtn.setVisible(false);
    this.audioBtnQ && this.audioBtnQ.setTexture("btnQPlayDefault");
    this.choiceBtnAudio &&
      Object.entries(this.choiceBtnAudio).map((btn, idx) =>
        btn[1].setTexture("btnCPlay")
      );
    this.choiceCheckbox &&
      Object.entries(this.choiceCheckbox).map((btn, idx) =>
        btn[1].setTexture("btnCheckBoxDefault")
      );
    //  audio
    this.stopAudio();
    //  data
    this.slctIdx = null;
    this.userAnswer = null;
    this.check = false;
  }
}
