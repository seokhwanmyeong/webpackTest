class Common extends Phaser.Scene {
  constructor(config) {
    super(config);
    this.graphics = null;
    this.audioBtnQ = null;
    this.userAnswer = "";
    this.btnReset = null;
    this.hintOkBtn = null;
    this.btnClosePopup = null;
    this.groupSounds = {};
    this.bgm = true;
    this.currentPlaying = "";
    this.check = false;
    this.isShowResultDialog = false;
    this.subtitleText = null;
    this.progressBarContainer = null;
    this.subtitleContainer = null;
  }

  preload() {
    console.log("Quize Preload Start");
    this.startTime = Date.now();
    this.template = this.game.template;
    const src = this.template.src;

    //  bgm
    if (src.audio.bgm) this.loadAudio("bgm", src.audio.bgm);
    //  button: image
    if (src.image.btn) this.loadImage("btn", src.image.btn);
    if (src.image.pop) this.loadImage("btn", src.image.pop);
    //  question
    if (this.template.questionImg)
      this.loadImage("questionContent", this.template.questionImg);
    if (this.template.questionVoice)
      this.loadAudio("questionContent", this.template.questionVoice);
    if (src.image.question) this.loadImage("question", src.image.question);
    if (src.audio.question) this.loadAudio("question", src.audio.question);
    //  choice
    if (this.template.choice && this.template.choice[0]?.image)
      this.loadImage("choiceContent", this.template.choice);
    if (this.template.choice && this.template.choice[0]?.audio)
      this.loadAudio("choiceContent", this.template.choice);
    if (src.image.choice) this.loadImage("choice", src.image.choice);
    if (src.audio.choice) this.loadAudio("choice", src.audio.choice);
    //  answer
    if (this.template.answerVoice)
      this.loadAudio("audioAnswer", this.template.answerVoice);

    if (
      (this.template.choice && this.template.choice[0]?.audio) ||
      this.template.questionVoice ||
      this.template.answerVoice
    )
      this.load.json("audioScript", "content/audioScript.json");

    console.log("Quize Preload End");
  }

  create() {
    this.input.setTopOnly(true);
    this.createHead();
    this.addBtnBgm();
    this.addBtnCheck();
    this.addBtnReset();
  }

  initQuiz() {
    get_QUIZ_INPUT(
      this.template.id,
      this.template.originType,
      "callBackQuizInput"
    );

    const interval = setInterval(() => {
      if (initComplete) {
        clearInterval(interval);
        if (initData && initData?.answer && initData?.input) {
          this.userAnswer = initData.input;

          if (
            this.choiceCheckbox &&
            this.choiceBtn &&
            this.qCheckbox &&
            this.qBtn
          ) {
            const split = this.userAnswer.split("-");
            this.qCheckbox[split[0] - 1].setTexture("btnCheckBoxPress");
            this.choiceCheckbox[split[1] - 1].setTexture("btnCheckBoxPress");
          } else if (this.choiceCheckbox && this.choiceBtn) {
            this.choiceCheckbox[this.userAnswer - 1].setTexture(
              "btnCheckBoxPress"
            );
          } else if (this.permanentLines && this.points) {
            let startPoint;
            let endPoint;

            if (typeof this.template.answer === "number") {
              for (let i = 0; i < this.points.length; i++) {
                const point = this.points[i];
                if (point.data.side === "left") startPoint = point;
                if (
                  point.data.side === "right" &&
                  point.data.index === initData.input
                )
                  endPoint = point;
              }
            } else {
              const correctStart = Number(initData?.input.split("-")[0]);
              const correctEnd = Number(initData?.input.split("-")[1]);

              for (let i = 0; i < this.points.length; i++) {
                const point = this.points[i];
                if (
                  point.data.side === "left" &&
                  point.data.index === correctStart
                )
                  startPoint = point;
                if (
                  point.data.side === "right" &&
                  point.data.index === correctEnd
                )
                  endPoint = point;
              }
            }
            const baseIndex = startPoint.data.index;
            const toIndex = endPoint.data.index;
            startPoint.data.connected = true;
            endPoint.data.connected = true;
            startPoint.data.linkIndex = toIndex;
            endPoint.data.linkIndex = baseIndex;
            this.connections[baseIndex] = toIndex;
            this.permanentLines[0] = new Phaser.Geom.Line(
              startPoint.x,
              startPoint.y,
              endPoint.x,
              endPoint.y
            );
          } else if (this.tImages && this.dropBoxes) {
            const wordType = ["W1", "W12", "W13", "W3", "W32", "W33"];
            let letterGroup = [];
            if (wordType.includes(this.template.type)) {
              letterGroup = initData?.input.split("");
            } else {
              const parts = this.tImages.map((img) => {
                return img.getData("text");
              });
              let modifiedInput = "";
              let partIndices = [];
              parts.forEach((part) => {
                let partIndex = initData.input.indexOf(part);
                while (partIndex !== -1) {
                  const isPrevCharAlpha =
                    partIndex > 0 &&
                    /[a-zA-Z]/.test(initData.input[partIndex - 1]);
                  const isNextCharAlpha =
                    partIndex + part.length < initData.input.length &&
                    /[a-zA-Z]/.test(initData.input[partIndex + part.length]);

                  if (isPrevCharAlpha || isNextCharAlpha) {
                    partIndex = initData.input.indexOf(part, partIndex + 1);
                  } else {
                    break;
                  }
                }
                const isPrevCharAlpha =
                  partIndex > 0 &&
                  /[a-zA-Z]/.test(initData.input[partIndex - 1]);
                const isNextCharAlpha =
                  partIndex + part.length < initData.input.length &&
                  /[a-zA-Z]/.test(initData.input[partIndex + part.length]);

                if (isPrevCharAlpha || isNextCharAlpha) {
                  partIndex = -1;
                }

                if (partIndex !== -1) {
                  partIndices.push({ part, index: partIndex });
                }
              });
              partIndices.sort((a, b) => a.index - b.index);
              partIndices.forEach((item, index) => {
                if (index > 0) {
                  modifiedInput += ",";
                }
                modifiedInput += item.part;
              });
              letterGroup = modifiedInput.split(",");
            }

            const letter = letterGroup;
            const fillArr = [];
            this.tImages.forEach((tImage) => {
              const text = tImage.getData("text");
              if (text !== " ") {
                let dropIdx = null;

                for (let i = 0; i < letter.length; i++) {
                  if (
                    tImage.getData("text") === letter[i] &&
                    !fillArr.includes(i)
                  ) {
                    dropIdx = i;
                    fillArr.push(i);
                    break;
                  }
                }

                if (dropIdx !== null) {
                  tImage.x = this.dropBoxes[dropIdx].x;
                  tImage.y = this.dropBoxes[dropIdx].y;
                  tImage.setData("isMove", true);
                }
              }
            });

            this.state = true;
          } else if (this.inputText && this.rt) {
            this.inputText.text = this.userAnswer;
          }
          this.showInit();
        } else if (initData && initData?.answer && this.stt) {
          this.showInit();
        }
      }
    }, 100);
  }

  createHead() {
    if (this.template.question) {
      const styleTitle = this.template.style.title;
      const boxTitle = this.add
        .graphics()
        .fillStyle(styleTitle.background, styleTitle.opacity);
      boxTitle.fillRoundedRect(
        this.cameras.main.centerX - styleTitle.width / 2,
        this.template.style.container.padding.top,
        styleTitle.width,
        styleTitle.height,
        styleTitle.radius
      );
    }
  }

  addBtnBgm() {
    const styleBtn = this.template.style.btnBgm;

    const playAudioButton = this.add
      .image(styleBtn.x, styleBtn.y, "btnBgmStopDefault")
      .setDisplaySize(styleBtn.width, styleBtn.height)
      .setOrigin(0, 0)
      .setInteractive();

    playAudioButton.on("pointerdown", () => {
      const bgm = this.groupSounds?.bgm?.bgm;

      if (bgm && bgm.isPlaying) {
        this.bgm = false;
        bgm.stop();
        playAudioButton.setTexture("btnBgmStopPress");
      } else {
        this.bgm = true;
        this.manageAudio("bgm", "bgm");
        playAudioButton.setTexture("btnBgmPlayPress");
      }
    });
    playAudioButton.on("pointerup", () => {
      const bgm = this.groupSounds?.bgm?.bgm;
      this.manageEffect("bgmClick", "effect");

      if (bgm && bgm.isPlaying) {
        playAudioButton.setTexture("btnBgmPlayDefault");
      } else {
        playAudioButton.setTexture("btnBgmStopDefault");
      }
    });

    this.btnBgm = playAudioButton;
  }

  addBtnCheck() {
    const styleBtn = this.template.style.btnCheck;

    let checkAnswerBtn = this.add
      .image(styleBtn.x, styleBtn.y, "btnCheckDefault")
      .setDisplaySize(styleBtn.width, styleBtn.height)
      .setOrigin(0, 0)
      .setVisible(userType === "TE")
      .setInteractive();

    checkAnswerBtn.on("pointerdown", () => {
      if (this.ocr && this.brushRt) {
        const canvas = this.brushRt.texture.canvas;
        if (canvas) {
          const tempCanvas = document.createElement("canvas");
          tempCanvas.width = canvas.width;
          tempCanvas.height = canvas.height;
          const tempCtx = tempCanvas.getContext("2d");
          tempCtx.drawImage(canvas, 0, 0);
          const imageData = tempCtx.getImageData(
            0,
            0,
            tempCanvas.width,
            tempCanvas.height
          );
          const data = imageData.data;

          for (let i = 0; i < data.length; i += 4) {
            if (data[i + 3] === 0) {
              data[i] = 255;
              data[i + 1] = 255;
              data[i + 2] = 255;
              data[i + 3] = 255;
            }
          }

          tempCtx.putImageData(imageData, 0, 0);
          const imgBase64 = tempCanvas.toDataURL("image/png");
          console.log(imgBase64);
          call_OCR_DIRECT(
            this.template.id,
            "english",
            imgBase64,
            "callBackOCR"
          );

          const interval = setInterval(() => {
            if (activeOcrCheck) {
              clearInterval(interval);
              this.userAnswer = resultOcrText || " ";
              checkAnswerBtn.setTexture("btnCheckPress");
              checkAnswerBtn.setVisible(false);
              return this.checkAnswers();
            }
          }, 100);
        }
      } else if (this.stt) {
        checkAnswerBtn.setTexture("btnCheckPress");
        checkAnswerBtn.setVisible(false);
        return this.checkAnswers();
      } else if (this.userAnswer && !this.check) {
        checkAnswerBtn.setTexture("btnCheckPress");
        checkAnswerBtn.setVisible(false);
        return this.checkAnswers();
      } else {
        return false;
      }
    });

    this.checkAnswerBtn = checkAnswerBtn;
  }

  addBtnReset() {
    const styleBtnChk = this.template.style.btnCheck;
    const styleBtn = this.template.style.btnReset;
    const isBottomPosition =
      this.template.originType === "W2H" ||
      this.template.originType === "W2M" ||
      this.template.originType === "W4"
        ? true
        : false;

    const btnReset = this.add
      .image(
        isBottomPosition ? styleBtn.x - styleBtn.width : styleBtn.x,
        isBottomPosition ? styleBtnChk.y : styleBtn.y,
        "btnResetDefault"
      )
      .setDisplaySize(styleBtn.width, styleBtn.height)
      .setOrigin(0, 0)
      .setInteractive()
      .setVisible(false);

    btnReset.on("pointerdown", () => {
      this.manageEffect("bgmClick", "effect");
      btnReset.setTexture("btnResetPress");
    });
    btnReset.on("pointerup", () => {
      btnReset.setVisible(false);
      btnReset.setTexture("btnResetDefault");
      this.resetGame();
    });

    this.btnReset = btnReset;
  }

  addAudioScript() {
    const styleAudioScript = this.game.template?.style?.audio?.script;
    const styleContainer = styleAudioScript?.container;
    const styleText = styleAudioScript?.text;
    const centerX = this.cameras.main.width / 2 + styleContainer.adjustWH.width;
    const centerY = this.cameras.main.height + styleContainer.adjustWH.height;
    const subtitleText = this.add.text(0, 0, "", styleText).setOrigin(0.5, 0.5);
    const background = this.add.graphics();

    this.subtitleContainer = this.add.container(centerX, centerY).setDepth(1);
    this.subtitleContainer.add([background, subtitleText]);
    this.subtitleText = subtitleText;
  }

  addProgressBar() {
    const styleContainer =
      this.game.template?.style?.audio?.script?.progressBar?.container;
    const progressBarBg = this.add.graphics();
    const progressBar = this.add.graphics();

    this.progressBarContainer = this.add.container(
      styleContainer.x,
      styleContainer.y
    );
    this.progressBarContainer.add([progressBarBg, progressBar]);
    this.progressBarContainer.setVisible(false);
    this.progressBarContainer.setDepth(1);
  }

  multiSelectAnswer(slctIdx, qSlctIdx) {
    if (slctIdx !== null && qSlctIdx !== null) {
      this.checkAnswerBtn.setVisible(true);
      this.userAnswer = `${qSlctIdx}-${slctIdx}`;
    }
  }

  selectAnswer(idx, answer, isShowReset = false) {
    if (this.check) {
      return false;
    } else {
      isShowReset && this.btnReset && this.btnReset.setVisible(true);
      this.slctIdx = idx;
      this.checkAnswerBtn.setVisible(true);
      this.userAnswer = answer;
      return true;
    }
  }

  showInit() {
    const characterScene = this.scene.get("Character");
    const correctAnswer = this.stt
      ? this.processSttInputAnswer(
          this.template.answerStt || this.template.answer
        )
      : this.template.answer;
    const isCorrect = this.userAnswer === correctAnswer;
    const character = this.template.anims.character;
    this.check = true;
    this.btnReset && this.btnReset.setVisible(false);
    this.audioBtnQ && this.audioBtnQ.setTexture("btnQPlayDefault");
    this.choiceBtnAudio &&
      Object.entries(this.choiceBtnAudio).map((btn, idx) =>
        btn[1].setTexture("btnCPlay")
      );

    if (this.userAnswer || this.stt) {
      characterScene.changeAnimation(
        isCorrect ? character?.correct[0] : character?.incorrect[0]
      );

      if (
        this.choiceCheckbox &&
        this.choiceCheckbox?.[0] &&
        this.qCheckbox &&
        this.qCheckbox?.[0]
      ) {
        const correctKey = this.correctImgKey || "btnCheckBoxCorrect";
        const incorrectKey = this.incorrectImgKey || "btnCheckBoxIncorrect";
        const split = correctAnswer.split("-");
        this.qCheckbox[split[0] - 1].setTexture(
          isCorrect ? correctKey : incorrectKey
        );

        this.choiceCheckbox[split[1] - 1].setTexture(
          isCorrect ? correctKey : incorrectKey
        );
      } else if (
        this.choiceCheckbox &&
        this.choiceCheckbox?.[correctAnswer - 1]
      ) {
        const correctKey = this.correctImgKey || "btnCheckBoxCorrect";
        const incorrectKey = this.incorrectImgKey || "btnCheckBoxIncorrect";
        this.choiceCheckbox[correctAnswer - 1].setTexture(
          isCorrect ? correctKey : incorrectKey
        );

        if (this.letterTrace && this.rt) {
          if (isCorrect) {
            const uniqueTextureKey = `letterTexture_${Date.now()}`;
            const canvas = document.createElement("canvas");
            canvas.width = this.board.displayWidth - 14;
            canvas.height = this.board.displayHeight - 32;
            const context = canvas.getContext("2d");
            context.font = "500 134px AmantaPrintRegular";
            context.fillStyle = "#000000";
            context.textAlign = "center";
            context.textBaseline = "middle";
            context.clearRect(0, 0, canvas.width, canvas.height);
            context.fillText(
              this.template.choice[this.template.answer - 1].text,
              canvas.width / 2,
              canvas.height / 2
            );

            this.state = true;
            this.textures.addCanvas(uniqueTextureKey, canvas);

            const image = this.make.image({
              x: this.rt.displayWidth / 2,
              y: this.rt.displayHeight / 2 - 7,
              key: uniqueTextureKey,
              add: false,
            });
            this.rt.draw(image);
          } else {
            const uniqueTextureKey = `letterTexture_${Date.now()}`;
            const canvas = document.createElement("canvas");
            canvas.width = this.board.displayWidth - 14;
            canvas.height = this.board.displayHeight - 32;
            const context = canvas.getContext("2d");
            context.font = "500 134px AmantaPrintRegular";
            context.fillStyle = "#000000";
            context.textAlign = "center";
            context.textBaseline = "middle";
            context.clearRect(0, 0, canvas.width, canvas.height);
            context.fillText(
              this.template.choice[this.userAnswer - 1].text,
              canvas.width / 2,
              canvas.height / 2
            );

            this.state = true;
            this.textures.addCanvas(uniqueTextureKey, canvas);

            const image = this.make.image({
              x: this.rt.displayWidth / 2,
              y: this.rt.displayHeight / 2 - 7,
              key: uniqueTextureKey,
              add: false,
            });
            this.rt.draw(image);

            this.add
              .text(
                this.rt.x + this.rt.width / 2,
                this.rt.y + this.rt.height - 2,
                this.template.choice[this.template.answer - 1].text,
                {
                  font: "500 66px AmantaPrintRegular",
                  fill: "#e7454d",
                }
              )
              .setOrigin(0.5, 0.5);
          }
        }
      } else if (this.permanentLines) {
        if (isCorrect) {
          this.points.map((point, i) => {
            if (
              (point.x === this.permanentLines[0].x1 &&
                point.y === this.permanentLines[0].y1) ||
              (point.x === this.permanentLines[0].x2 &&
                point.y === this.permanentLines[0].y2)
            ) {
              point
                .setFillStyle(0x5986ed)
                .setStrokeStyle(1, 0x5986ed)
                .setDepth(7);
            }
          });
          this.add
            .graphics({
              lineStyle: { width: 8, color: 0x5986ed },
            })
            .strokeLineShape(this.permanentLines[0])
            .setDepth(7);
        } else {
          let start = null;
          let end = null;

          if (typeof correctAnswer === "number") {
            this.points.map((point, i) => {
              if (
                point.data.side === "left" ||
                (point.data.side === "right" &&
                  point.data.index === correctAnswer)
              ) {
                point
                  .setFillStyle(0xe7454d)
                  .setStrokeStyle(1, 0xe7454d)
                  .setDepth(7);

                if (!start) start = point;
                else if (!end) end = point;
              }
            });
          } else {
            const correctStart = Number(this.template?.answer.split("-")[0]);
            const correctEnd = Number(this.template?.answer.split("-")[1]);

            this.points.map((point, i) => {
              if (
                point.data.side === "left" &&
                point.data.index === correctStart
              ) {
                point
                  .setFillStyle(0xe7454d)
                  .setStrokeStyle(1, 0xe7454d)
                  .setDepth(7);

                start = point;
              } else if (
                point.data.side === "right" &&
                point.data.index === correctEnd
              ) {
                point
                  .setFillStyle(0xe7454d)
                  .setStrokeStyle(1, 0xe7454d)
                  .setDepth(7);

                end = point;
              }
            });
          }

          this.drawDashedLine(start.x, start.y, end.x, end.y, 5, 5);
        }
      } else if (this.tImages && !isCorrect && this.template.style.answerBox) {
        const styleAnswer = this.template.style.answerBox;
        if (this.isSentance) {
          let tText = this.add
            .text(
              this.cameras.main.centerX,
              styleAnswer.y,
              this.template.answer +
                (this.template.endpoint === 1
                  ? "."
                  : this.template.endpoint === 2
                  ? "?"
                  : ""),
              {
                ...styleAnswer.font,
              }
            )
            .setOrigin(0.5, 0.6);
        } else {
          const questionTxt = this.template.answer;
          const userAnswer = this.userAnswer;
          const totalWidth =
            (userAnswer.length - 1) *
            (styleAnswer.boxSpacing + styleAnswer.width);
          const startX =
            this.cameras.main.centerX - totalWidth / 2 + (styleAnswer.x || 0);
          const startY = styleAnswer.y;

          for (let i = 0; i < questionTxt.length; i++) {
            let tText = this.add
              .text(0, 0, questionTxt[i], {
                ...styleAnswer.font,
              })
              .setOrigin(0.5, 0.6);
            let container = this.add.container(
              startX + i * (styleAnswer.width + styleAnswer.boxSpacing),
              startY,
              [tText]
            );
            if (questionTxt[i] === " ") {
              container.setAlpha(0);
            }
          }
        }
      } else if (this.inputText && !isCorrect && this.rt) {
        this.rt.clear();
        this.add
          .text(
            this.rt.x + this.rt.width / 2,
            this.rt.y + this.rt.height + 65,
            this.template.answer +
              (this.template.endpoint === 1
                ? "."
                : this.template.endpoint === 2
                ? "?"
                : ""),
            {
              font: "500 65px AmantaPrintRegular",
              fill: "#e7454d",
              stroke: "#ffffff",
              strokeThickness: 6,
            }
          )
          .setOrigin(0.5, 0.5);
      } else if (this.ocr && this.brushRt && this.rt) {
        if (isCorrect) {
          const uniqueTextureKey = `letterTexture_${Date.now()}`;
          const canvas = document.createElement("canvas");
          canvas.width = this.board.displayWidth - 14;
          canvas.height = this.board.displayHeight - 32;
          const context = canvas.getContext("2d");
          context.font = "500 65px AmantaPrintRegular";
          context.fillStyle = "#000000";
          context.textAlign = "center";
          context.textBaseline = "middle";
          context.clearRect(0, 0, canvas.width, canvas.height);
          context.fillText(
            this.template.answer,
            canvas.width / 2,
            canvas.height / 2
          );
          this.letterTexture = this.textures.addCanvas(
            uniqueTextureKey,
            canvas
          );

          const image = this.make.image({
            x: this.rt.displayWidth / 2,
            y: this.rt.displayHeight / 2 - 1,
            key: uniqueTextureKey,
            add: false,
          });
          this.rt.draw(image);
        } else {
          this.rt.clear();
          const uniqueTextureKey = `letterTexture_${Date.now()}`;
          const canvas = document.createElement("canvas");
          canvas.width = this.board.displayWidth - 14;
          canvas.height = this.board.displayHeight - 32;
          const context = canvas.getContext("2d");
          context.font = "500 65px AmantaPrintRegular";
          context.fillStyle = "#000000";
          context.textAlign = "center";
          context.textBaseline = "middle";
          context.clearRect(0, 0, canvas.width, canvas.height);
          context.fillText(
            this.userAnswer,
            canvas.width / 2,
            canvas.height / 2
          );
          this.letterTexture = this.textures.addCanvas(
            uniqueTextureKey,
            canvas
          );

          const image = this.make.image({
            x: this.rt.displayWidth / 2,
            y: this.rt.displayHeight / 2,
            key: uniqueTextureKey,
            add: false,
          });
          this.rt.draw(image);

          this.add
            .text(
              this.rt.x + this.rt.width / 2,
              this.rt.y + this.rt.height + 48,
              this.template.answer +
                (this.template.endpoint === 1
                  ? "."
                  : this.template.endpoint === 2
                  ? "?"
                  : ""),
              {
                font: "500 65px AmantaPrintRegular",
                fill: "#e7454d",
                stroke: "#ffffff",
                strokeThickness: 6,
              }
            )
            .setOrigin(0.5, 0.5);
        }
      } else if (this.letterTrace && this.rt) {
        if (isCorrect) {
          const uniqueTextureKey = `letterTexture_${Date.now()}`;
          const canvas = document.createElement("canvas");
          canvas.width = this.board.displayWidth - 14;
          canvas.height = this.board.displayHeight - 32;
          const context = canvas.getContext("2d");
          context.font = "500 134px AmantaPrintRegular";
          context.fillStyle = "#000000";
          context.textAlign = "center";
          context.textBaseline = "middle";
          context.clearRect(0, 0, canvas.width, canvas.height);
          context.fillText(
            this.template.answer,
            canvas.width / 2,
            canvas.height / 2
          );

          this.state = true;
          this.textures.addCanvas(uniqueTextureKey, canvas);

          const image = this.make.image({
            x: this.rt.displayWidth / 2,
            y: this.rt.displayHeight / 2 - 8,
            key: uniqueTextureKey,
            add: false,
          });
          this.rt.draw(image);
        } else {
          this.add
            .text(
              this.rt.x + this.rt.width / 2,
              this.rt.y + this.rt.height,
              this.template.answer,
              {
                font: "500 42px AmantaPrintRegular",
                fill: "#e7454d",
              }
            )
            .setOrigin(0.5, 0.5);
        }
      } else if (this.stt) {
        if (!isCorrect) {
          if (this.template.type.includes("A2")) {
            const style = this.template?.style?.card?.choice?.mic;
            this.add
              .text(
                (style?.x || 0) + (style?.width || 0) / 2,
                (style?.y || 0) + (style?.height || 0) + 24,
                this.template.answer,
                {
                  font: "500 42px AmantaPrintRegular",
                  fill: "#e7454d",
                  stroke: "#ffffff",
                  strokeThickness: 6,
                }
              )
              .setOrigin(0.5, 0.5);
          } else if (!this.template.type.includes("P32")) {
            const style = this.template?.style?.card?.question;
            this.add
              .text(
                (style?.x || 0) + (style?.width || 0) / 2,
                (style?.y || 0) + (style?.height || 0) + 65,
                this.template.answer,
                {
                  font: "500 42px AmantaPrintRegular",
                  fill: "#e7454d",
                  stroke: "#ffffff",
                  strokeThickness: 6,
                }
              )
              .setOrigin(0.5, 0.5);
          }

          this.btnRecord && this.btnRecord.setVisible(false);
          this.btnAnswerPlay && this.btnAnswerPlay.setVisible(true);
        }
        this.btnRecord.setTexture("btnRecordComplete");
      }
    }
  }

  checkAnswers() {
    const characterScene = this.scene.get("Character");
    const correctAnswer = this.stt
      ? this.template.answerStt
      : this.template.answer;
    const isCorrect = this.stt
      ? Number(resultSttScore) >= 70
      : this.userAnswer === correctAnswer;
    const character = this.template.anims.character;

    this.btnReset && this.btnReset.setVisible(false);
    this.audioBtnQ && this.audioBtnQ.setTexture("btnQPlayDefault");
    this.choiceBtnAudio &&
      Object.entries(this.choiceBtnAudio).map((btn, idx) =>
        btn[1].setTexture("btnCPlay")
      );

    if (this.userAnswer || this.stt) {
      this.check = true;
      characterScene.changeAnimation(
        isCorrect ? character?.correct[0] : character?.incorrect[0]
      );

      if (
        this.choiceCheckbox &&
        this.choiceCheckbox?.[0] &&
        this.qCheckbox &&
        this.qCheckbox?.[0]
      ) {
        const correctKey = this.correctImgKey || "btnCheckBoxCorrect";
        const incorrectKey = this.incorrectImgKey || "btnCheckBoxIncorrect";
        const split = correctAnswer.split("-");
        this.qCheckbox[split[0] - 1].setTexture(
          isCorrect ? correctKey : incorrectKey
        );

        this.choiceCheckbox[split[1] - 1].setTexture(
          isCorrect ? correctKey : incorrectKey
        );

        if (isCorrect) {
          this.showResult(true);
        } else {
          this.showResult(false);
        }
      } else if (
        this.choiceCheckbox &&
        this.choiceCheckbox?.[correctAnswer - 1]
      ) {
        const correctKey = this.correctImgKey || "btnCheckBoxCorrect";
        const incorrectKey = this.incorrectImgKey || "btnCheckBoxIncorrect";
        this.choiceCheckbox[correctAnswer - 1].setTexture(
          isCorrect ? correctKey : incorrectKey
        );
        if (isCorrect) {
          this.showResult(true);
        } else {
          this.showResult(false);
        }
      } else if (this.permanentLines) {
        if (isCorrect) {
          this.showResult(true);
          this.points.map((point, i) => {
            if (
              (point.x === this.permanentLines[0].x1 &&
                point.y === this.permanentLines[0].y1) ||
              (point.x === this.permanentLines[0].x2 &&
                point.y === this.permanentLines[0].y2)
            ) {
              point
                .setFillStyle(0x5986ed)
                .setStrokeStyle(1, 0x5986ed)
                .setDepth(7);
            }
          });
          this.add
            .graphics({
              lineStyle: { width: 8, color: 0x5986ed },
            })
            .strokeLineShape(this.permanentLines[0])
            .setDepth(7);
        } else {
          let start = null;
          let end = null;
          this.showResult(false);

          if (typeof correctAnswer === "number") {
            this.points.map((point, i) => {
              if (
                point.data.side === "left" ||
                (point.data.side === "right" &&
                  point.data.index === correctAnswer)
              ) {
                point
                  .setFillStyle(0xe7454d)
                  .setStrokeStyle(1, 0xe7454d)
                  .setDepth(7);

                if (!start) start = point;
                else if (!end) end = point;
              }
            });
          } else {
            const correctStart = Number(this.template?.answer.split("-")[0]);
            const correctEnd = Number(this.template?.answer.split("-")[1]);

            this.points.map((point, i) => {
              if (
                point.data.side === "left" &&
                point.data.index === correctStart
              ) {
                point
                  .setFillStyle(0xe7454d)
                  .setStrokeStyle(1, 0xe7454d)
                  .setDepth(7);

                start = point;
              } else if (
                point.data.side === "right" &&
                point.data.index === correctEnd
              ) {
                point
                  .setFillStyle(0xe7454d)
                  .setStrokeStyle(1, 0xe7454d)
                  .setDepth(7);

                end = point;
              }
            });
          }
          this.drawDashedLine(start.x, start.y, end.x, end.y, 5, 5);
        }
      } else if (this.tImages && this.template.style.answerBox) {
        if (isCorrect) {
          this.showResult(true);
        } else {
          const styleAnswer = this.template.style.answerBox;
          if (this.isSentance) {
            let tText = this.add
              .text(
                this.cameras.main.centerX,
                styleAnswer.y,
                this.template.answer +
                  (this.template.endpoint === 1
                    ? "."
                    : this.template.endpoint === 2
                    ? "?"
                    : ""),
                {
                  ...styleAnswer.font,
                }
              )
              .setOrigin(0.5, 0.6);
          } else {
            const questionTxt = this.template.answer;
            const userAnswer = this.userAnswer;
            const totalWidth =
              (userAnswer.length - 1) *
              (styleAnswer.boxSpacing + styleAnswer.width);
            const startX =
              this.cameras.main.centerX - totalWidth / 2 + (styleAnswer.x || 0);
            const startY = styleAnswer.y;

            for (let i = 0; i < questionTxt.length; i++) {
              let tText = this.add
                .text(0, 0, questionTxt[i], {
                  ...styleAnswer.font,
                })
                .setOrigin(0.5, 0.6);
              let container = this.add.container(
                startX + i * (styleAnswer.width + styleAnswer.boxSpacing),
                startY,
                [tText]
              );
              if (questionTxt[i] === " ") {
                container.setAlpha(0);
              }
            }
          }
          this.showResult(false);
        }
      } else if (this.inputText && this.rt) {
        if (isCorrect) {
          this.showResult(true);
        } else {
          this.showResult(false);
          this.add
            .text(
              this.rt.x + this.rt.width / 2,
              this.rt.y + this.rt.height + 65,
              this.template.answer +
                (this.template.endpoint === 1
                  ? "."
                  : this.template.endpoint === 2
                  ? "?"
                  : ""),
              {
                font: "500 66px AmantaPrintRegular",
                fill: "#e7454d",
                stroke: "#ffffff",
                strokeThickness: 6,
              }
            )
            .setOrigin(0.5, 0.5);
        }
      } else if (this.ocr && this.brushRt && this.rt) {
        if (isCorrect) {
          this.showResult(true);
        } else {
          this.showResult(false);
          this.add
            .text(
              this.rt.x + this.rt.width / 2,
              this.rt.y + this.rt.height + 48,
              this.template.answer +
                (this.template.endpoint === 1
                  ? "."
                  : this.template.endpoint === 2
                  ? "?"
                  : ""),
              {
                font: "500 65px AmantaPrintRegular",
                fill: "#e7454d",
                stroke: "#ffffff",
                strokeThickness: 6,
              }
            )
            .setOrigin(0.5, 0.5);
        }
      } else if (this.letterTrace && this.rt) {
        if (isCorrect) {
          this.showResult(true);
        } else {
          this.showResult(false);
          this.add
            .text(
              this.rt.x + this.rt.width / 2,
              this.rt.y + this.rt.height,
              this.template.answer,
              {
                font: "500 42px AmantaPrintRegular",
                fill: "#e7454d",
              }
            )
            .setOrigin(0.5, 0.5);
        }
      } else if (this.stt) {
        if (isCorrect) {
          this.showResult(true);
        } else {
          if (this.template.type.includes("A2")) {
            const style = this.template?.style?.card?.choice?.mic;
            this.add
              .text(
                (style?.x || 0) + (style?.width || 0) / 2,
                (style?.y || 0) + (style?.height || 0) + 24,
                this.template.answer,
                {
                  font: "500 42px AmantaPrintRegular",
                  fill: "#e7454d",
                  stroke: "#ffffff",
                  strokeThickness: 6,
                }
              )
              .setOrigin(0.5, 0.5);
          } else if (!this.template.type.includes("P32")) {
            const style = this.template?.style?.card?.question;
            this.add
              .text(
                (style?.x || 0) + (style?.width || 0) / 2,
                (style?.y || 0) + (style?.height || 0) + 65,
                this.template.answer,
                {
                  font: "500 42px AmantaPrintRegular",
                  fill: "#e7454d",
                  stroke: "#ffffff",
                  strokeThickness: 6,
                }
              )
              .setOrigin(0.5, 0.5);
          }

          this.btnRecord && this.btnRecord.setVisible(false);
          this.btnAnswerPlay && this.btnAnswerPlay.setVisible(true);
          this.showResult(false);
        }
      }

      this.showDialog("checkAnswer", "");
      return true;
    } else {
      return false;
    }
  }

  showResult(isCorrect) {
    let startTime = this.startTime || Date.now();
    let endTime = Date.now();
    const time = Math.floor((endTime - startTime) / 1000);

    if (isCorrect) {
      set_QUIZ_INPUT(
        this.template.id,
        this.template.originType,
        this.ocr
          ? this.template.answer
          : this.stt
          ? this.processSttInputAnswer(
              this.template.answerStt || this.template.answer
            )
          : this.userAnswer,
        this.stt
          ? this.processSttInputAnswer(
              this.template.answerStt || this.template.answer
            )
          : this.template.answer,
        time
      );
      set_QUIZ_CORRECT(this.template.id, this.template.originType, "1");

      // 정답일 때의 로직 추가
      console.log("정답입니다!");
    } else {
      set_QUIZ_INPUT(
        this.template.id,
        this.template.originType,
        this.stt ? " " : this.userAnswer,
        this.stt
          ? this.processSttInputAnswer(
              this.template.answerStt || this.template.answer
            )
          : this.template.answer,
        time
      );
      set_QUIZ_CORRECT(this.template.id, this.template.originType, "0");

      // 오답일 때의 로직 추가
      console.log("오답입니다!");
    }
  }

  showDialog(type, message) {
    if (type === "dialog") {
      if (!this.dialog) {
        this.dialog = this.add
          .image(
            this.cameras.main.centerX,
            this.cameras.main.height - 50,
            "popDialogSound"
          )
          .setScale(0.5)
          .setDepth(10);

        setTimeout(() => {
          this.dialog.destroy();
          this.dialog = null;
        }, 1000);
      }
    } else {
      if (type === "checkAnswer") {
        const correctAnswer = this.stt
          ? this.template.answerStt
          : this.template.answer;
        const isCorrect = this.stt
          ? Number(resultSttScore) >= 70
          : this.userAnswer === correctAnswer;
        const characterScene = this.scene.get("Character");
        const domTyping = document.getElementById("typing");

        if (domTyping) domTyping.style.pointerEvents = "none";

        if (isCorrect) this.manageAudio("bgmCorrect", "effect");
        else this.manageAudio("bgmIncorrect", "effect");

        if (this.isShowResultDialog) {
          let pop = null;
          this.dialogBox = this.add
            .rectangle(
              this.cameras.main.centerX,
              this.cameras.main.centerY,
              this.cameras.main.width,
              this.cameras.main.height,
              0x000000
            )
            .setAlpha(0.5)
            .setDepth(10)
            .setInteractive();

          pop = this.add
            .image(
              this.cameras.main.centerX,
              this.cameras.main.centerY,
              isCorrect ? "popCorrect" : "popIncorrect"
            )
            .setDepth(10);

          characterScene.setVisibleCharacter(false);
          const okButton = this.add
            .rectangle(
              this.cameras.main.centerX + 60,
              this.cameras.main.centerY + 136,
              186,
              94,
              0x000000,
              0
            )
            .setDepth(11)
            .setInteractive();
          okButton.on("pointerup", (pointer, x, y, event) => {
            characterScene.setVisibleCharacter(true);
            this.stopAudio();
            this.manageEffect("bgmClick", "effect");
            this.dialogBox.destroy();
            pop.destroy();
            okButton.destroy();
            pop = null;
            this.btnClosePopup = null;
            const domTyping = document.getElementById("typing");

            if (domTyping) domTyping.style.pointerEvents = "auto";
          });

          this.btnClosePopup = okButton;
        }
      } else if (type === "hint") {
        const styleHint = this.template.style.card?.question?.hint;

        if (styleHint && message) {
          this.dialogBox = this.add
            .rectangle(
              this.cameras.main.centerX,
              this.cameras.main.centerY,
              this.cameras.main.width,
              this.cameras.main.height,
              0x000000
            )
            .setAlpha(0.5)
            .setDepth(10)
            .setInteractive();

          const frameHint = this.add
            .image(
              this.cameras.main.centerX,
              this.cameras.main.centerY - 20,
              "frameHint"
            )
            .setDisplaySize(styleHint.width, styleHint.height)
            .setInteractive()
            .setDepth(11);
          const txtWidth = (frameHint.displayWidth * 9) / 10;
          const txtHint = this.add
            .text(frameHint.x, frameHint.y + 10, message, {
              ...styleHint.font,
              wordWrap: {
                width: txtWidth,
                useAdvancedWrap: true,
              },
            })
            .setDepth(11)
            .setOrigin(0.5, 0.5);

          const okButton = this.add
            .image(
              this.cameras.main.centerX,
              frameHint.y + frameHint.displayHeight / 2 - 18,
              "btnHintConfirm"
            )
            .setDisplaySize(styleHint.btn.width, styleHint.btn.height)
            .setInteractive()
            .setDepth(11);

          okButton.on("pointerdown", () => {
            this.manageEffect("bgmClick", "effect");
            this.dialogBox.destroy();
            frameHint.destroy();
            txtHint.destroy();
            okButton.destroy();
            this.hintOkBtn = null;
          });

          this.hintOkBtn = okButton;
        }
      }
    }
  }

  showResultTE() {
    const styleDialog = this.template.style.dialog?.resultTE;
    const correctAnswer = this.template.answer;

    if (styleDialog) {
      this.dialogBox = this.add
        .rectangle(
          this.cameras.main.centerX,
          this.cameras.main.centerY,
          this.cameras.main.width,
          this.cameras.main.height,
          0x000000
        )
        .setAlpha(0.5)
        .setDepth(10)
        .setInteractive();

      const frameDialog = this.add
        .image(
          this.cameras.main.centerX,
          this.cameras.main.centerY,
          "popResultTE"
        )
        .setDisplaySize(styleDialog.width, styleDialog.height)
        .setInteractive()
        .setDepth(11);
      const txtWidth = (frameDialog.displayWidth * 9) / 10;
      const txtDialog = this.add
        .text(frameDialog.x, frameDialog.y - 20, `${correctAnswer}`, {
          ...styleDialog.font,
          wordWrap: {
            width: txtWidth,
            useAdvancedWrap: true,
          },
          lineSpacing: 10,
        })
        .setDepth(11)
        .setOrigin(0.5, 0.5);

      const okButton = this.add
        .rectangle(
          this.cameras.main.centerX,
          this.cameras.main.centerY + 106,
          styleDialog.btn.width - 16,
          styleDialog.btn.height - 16,
          0x000000,
          0
        )
        .setDepth(11)
        .setInteractive();

      okButton.on("pointerdown", () => {
        this.manageEffect("bgmClick", "effect");
        this.dialogBox.destroy();
        frameDialog.destroy();
        txtDialog.destroy();
        okButton.destroy();
        this.hintOkBtn = null;
      });

      this.hintOkBtn = okButton;
    }
  }

  drawDashedLine(startX, startY, endX, endY, dashLength, gapLength) {
    const graphics = this.add.graphics();
    const xDiff = endX - startX;
    const yDiff = endY - startY;
    const lineLength = Math.sqrt(xDiff * xDiff + yDiff * yDiff);
    const numberOfDashes = Math.floor(lineLength / (dashLength + gapLength));
    const dashX = (xDiff / lineLength) * dashLength;
    const dashY = (yDiff / lineLength) * dashLength;
    const gapX = (xDiff / lineLength) * gapLength;
    const gapY = (yDiff / lineLength) * gapLength;

    graphics.lineStyle(8, 0xe7454d);

    for (let i = 0; i < numberOfDashes; i++) {
      const x1 = startX + (dashX + gapX) * i;
      const y1 = startY + (dashY + gapY) * i;
      const x2 = x1 + dashX;
      const y2 = y1 + dashY;

      graphics.moveTo(x1, y1);
      graphics.lineTo(x2, y2);
    }

    graphics.strokePath();
  }

  processTemplateAnswer(answer) {
    if (answer.includes("|")) {
      const arr = answer.split("|").map((text) => {
        let processedAnswer = text.replace(/([.?!,])(?!$)/g, " ");
        processedAnswer = processedAnswer.replace(/[.?!,]$/g, "");

        return processedAnswer;
      });

      return arr;
    } else if (answer.includes("/")) {
      const arr = answer.split("/").map((text) => {
        let processedAnswer = text.replace(/([.?!,])(?!$)/g, " ");
        processedAnswer = processedAnswer.replace(/[.?!,]$/g, "");

        return processedAnswer;
      });

      return arr;
    } else if (answer.includes("^")) {
      const arr = answer.split("^").map((text) => {
        let processedAnswer = text.replace(/([.?!,])(?!$)/g, " ");
        processedAnswer = processedAnswer.replace(/[.?!,]$/g, "");

        return processedAnswer;
      });

      return arr;
    } else if (
      answer.includes(".") ||
      answer.includes("?") ||
      answer.includes("!") ||
      answer.includes(",")
    ) {
      let processedAnswer = answer.replace(/([.?!,])(?!$)/g, " ");
      processedAnswer = processedAnswer.replace(/[.?!,]$/g, "");
      return processedAnswer;
    } else {
      return answer;
    }
  }

  processSttInputAnswer(answer) {
    if (answer.includes("|")) {
      const arr = answer.split("|").map((text) => {
        return text;
      });

      return arr.join("^");
    } else if (answer.includes("/")) {
      const arr = answer.split("/").map((text) => {
        return text;
      });

      return arr.join("^");
    } else {
      return answer;
    }
  }

  stopAudio() {
    this.resetAudioScript();
    this.sound.sounds.forEach((e) => {
      if (e?.key !== "bgm" && e?.key !== "effect") e.isPlaying && e.stop();
    });

    if (this.bgm && this.groupSounds?.bgm?.bgm?.isPaused)
      this.groupSounds.bgm.bgm.resume();

    this.currentPlaying = null;
  }

  manageAudio(key, group) {
    this.stopAudio();

    if (!this.groupSounds?.[group]?.[key]) {
      const newSound = this.sound.add(key, {
        volume: key === "bgm" ? 0.1 : 1,
        loop: key === "bgm",
      });

      this.groupSounds?.[group]
        ? (this.groupSounds[group][key] = newSound)
        : (this.groupSounds[group] = { [key]: newSound });
    }

    if (group === "audioChoice") {
      this.btnAnswerPlay && this.btnAnswerPlay.setTexture("btnAnswerAudioPlay");
      this.audioBtnQ && this.audioBtnQ.setTexture("btnQPlayDefault");
      this.choiceBtnAudio &&
        Object.entries(this.choiceBtnAudio).map(
          (btn) => btn[0] !== key && btn[1].setTexture("btnCPlay")
        );
    } else if (group === "audioQuestion" && this.choiceBtnAudio) {
      this.btnAnswerPlay && this.btnAnswerPlay.setTexture("btnAnswerAudioPlay");
      Object.entries(this.choiceBtnAudio).map((btn, idx) =>
        btn[1].setTexture("btnCPlay")
      );
    } else if (group === "audioAnswer" && this.btnAnswerPlay) {
      this.audioBtnQ && this.audioBtnQ.setTexture("btnQPlayDefault");
      this.choiceBtnAudio &&
        Object.entries(this.choiceBtnAudio).map((btn, idx) =>
          btn[1].setTexture("btnCPlay")
        );
    }

    if (key !== "bgm" && this.bgm && this.groupSounds?.bgm?.bgm) {
      this.groupSounds.bgm.bgm.pause();
    }

    this.manageAudioScript(key, group);
    this.currentPlaying = key !== "bgm" ? key : null;
    this.groupSounds[group][key].play();
    this.groupSounds[group][key].on("complete", () => {
      if (this.bgm && this.groupSounds?.bgm?.bgm) {
        this.groupSounds.bgm.bgm.resume();
      }

      if (group === "audioChoice" && this.choiceBtnAudio) {
        this.choiceBtnAudio[key].setTexture("btnCPlay");
      } else if (group === "audioQuestion") {
        this.audioBtnQ.setTexture("btnQPlayDefault");
      } else if (group === "audioAnswer" && this.btnAnswerPlay) {
        this.btnAnswerPlay.setTexture("btnAnswerAudioPlay");
      }

      this.resetAudioScript();
      this.currentPlaying = null;
    });
  }

  manageEffect(key, group) {
    if (!this.groupSounds?.[group]?.[key]) {
      const newSound = this.sound.add(key, {
        volume: key === "bgm" ? 0.1 : 0.1,
        loop: key === "bgm",
      });

      this.groupSounds?.[group]
        ? (this.groupSounds[group][key] = newSound)
        : (this.groupSounds[group] = { [key]: newSound });
    }

    this.groupSounds[group][key].play();
  }

  manageAudioScript(key, group) {
    if (
      group === "audioChoice" ||
      group === "audioQuestion" ||
      group === "audioAnswer"
    ) {
      const audioScript = this.cache.json.get("audioScript");
      let idx = 1;
      let typeTxt = "";
      let subtitles = [];

      switch (group) {
        case "audioChoice":
          idx = key.slice(key.length - 1, key.length);
          typeTxt = `보기 음원 ${idx}번\n`;
          subtitles = audioScript[`c${idx}`];
          break;
        case "audioQuestion":
          typeTxt = `문제 음원\n`;
          subtitles = audioScript[`q${idx}`];
          break;
        case "audioAnswer":
          typeTxt = `정답 음원\n`;
          subtitles = audioScript[`a${idx}`];
          break;
        default:
          break;
      }

      if (!this.subtitleText) this.addAudioScript();
      if (!this.progressBarContainer) this.addProgressBar();

      let currentTime = 0;
      this.subtitleEvent = this.time.addEvent({
        delay: 10,
        callback: () => {
          currentTime += 0.01;

          if (this.subtitleContainer && !this.subtitleContainer.visible) {
            this.subtitleContainer.setVisible(true);
            this.progressBarContainer.setVisible(false);
          } else this.progressBarContainer.setVisible(true);

          subtitles.forEach((subtitle) => {
            if (currentTime >= subtitle.start && currentTime <= subtitle.end) {
              const script = `${typeTxt} ${subtitle.text}`;
              const subtitleBounds = this.subtitleText.getBounds();
              const totalDuration = subtitles[subtitles.length - 1].end;
              const progressWidth =
                (currentTime / totalDuration) * subtitleBounds.width;

              this.subtitleText.setText(script);
              this.handlerStyleScriptDeem();
              this.progressBarContainer.setPosition(
                subtitleBounds.x,
                subtitleBounds.bottom - 40
              );
              this.handlerStyleScriptBar(subtitleBounds.width, progressWidth);
            }
          });
        },
        loop: true,
      });
    }
  }

  handlerStyleScriptDeem() {
    const styleDeem = this.game.template?.style?.audio?.script?.deem;

    const background = this.subtitleContainer.getAt(0);
    background.clear();
    background.fillStyle(styleDeem.fill, styleDeem.opacity);
    background.fillRoundedRect(
      -this.subtitleText.width / 2 + styleDeem.adjustXY.x0,
      -this.subtitleText.height / 2 + styleDeem.adjustXY.y0,
      this.subtitleText.width + styleDeem.adjustXY.x1,
      this.subtitleText.height + styleDeem.adjustXY.y1,
      styleDeem.radius
    );
  }

  handlerStyleScriptBar(bgWidth, barWidth) {
    const styleProgressBar =
      this.game.template?.style?.audio?.script?.progressBar;
    const styleBg = styleProgressBar?.bg;
    const styleBar = styleProgressBar?.bar;
    const progressBarBg = this.progressBarContainer.getAt(0);
    const progressBar = this.progressBarContainer.getAt(1);

    progressBarBg.clear();
    progressBarBg.fillStyle(styleBg.fill, styleBg.opacity);
    progressBarBg.fillRect(0, 0, bgWidth || styleBg.width, styleBg.height);
    progressBar.clear();
    progressBar.fillStyle(styleBar.fill, styleBar.opacity);
    progressBar.fillRect(0, 0, barWidth || styleBar.width, styleBar.height);
  }

  resetAudioScript() {
    if (this.subtitleEvent) this.subtitleEvent.remove();
    if (this.subtitleText) {
      this.subtitleText.setText("");
      this.subtitleContainer.setVisible(false);
      this.progressBarContainer.setVisible(false);
    }
  }

  loadAudio(cate, data) {
    switch (cate) {
      case "question":
        data.map((audioObj) => this.loader("audio", audioObj));
        break;
      case "choice":
        data.map((audioObj) => this.loader("audio", audioObj));
        break;
      case "bgm":
        data.map((audioObj) => this.loader("audio", audioObj));
        break;
      case "questionContent":
        this.load.audio("question", data);
        break;
      case "choiceContent":
        data.map((choice, i) => {
          if (choice.audio) this.load.audio(`choice${i + 1}`, choice.audio);
        });
        break;
      case "audioAnswer":
        this.load.audio("answerMp3", data);
        break;
      default:
        break;
    }
  }

  loadImage(cate, data) {
    switch (cate) {
      case "bg":
        this.loader("image", data);
        break;
      case "btn":
        data.map((imageObj) => this.loader("image", imageObj));
        break;
      case "character":
        data.map((imageObj) => {
          for (let i = 0; i <= imageObj.scene; i++) {
            this.loader("image", {
              ...imageObj,
              key: `${imageObj.key}${i}`,
              name: `${imageObj.name}${i}`,
            });
          }
        });
        break;
      case "question":
        data.map((obj) => this.loader("image", obj));
        break;
      case "choice":
        data.map((obj) => this.loader("image", obj));
        break;
      case "questionContent":
        this.load.image("question", data);
        break;
      case "choiceContent":
        data.map((choice, i) => {
          if (choice.image) this.load.image(`choice${i + 1}`, choice.image);
        });
        break;
      default:
        break;
    }
  }

  loader(type, obj) {
    const { key, root, name, fileExtends } = obj;

    switch (type) {
      case "image":
        this.load.image(key, `${root}${name}.${fileExtends}`);
        break;
      case "audio":
        this.load.audio(key, `${root}${name}.${fileExtends}`);
        break;
      default:
        break;
    }
  }
}
