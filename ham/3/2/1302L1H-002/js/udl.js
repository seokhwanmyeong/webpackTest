class Udl extends Phaser.Scene {
  constructor() {
    super({ key: "Udl" });
    this.stateAlt = {
      bgm: "배경 음악 켜기",
      reset: "다시 풀기",
      checkAnswer: "정답 확인 하기",
      mic: "녹음하기",
    };
    this.choiceChk = [];
    this.tileList = [];
    this.cardList = [];
    this.inputArea = null;
    this.isTyping = false;
    this.bgmPosition = "bot";
    this.isOx = false;
    this.sendCheck = false;
  }

  preload() {
    console.log("UDL Preload start");
    this.load.path = "./";
    this.load.json("common", "content/common.json");
    this.load.json("template", "content/template.json");
    this.load.json("quize", "content/quize.json");
    this.load.json("animation", "content/animation.json");
    this.load.json("udl", "content/udl.json");
    console.log("UDL Preload end");
  }

  create() {
    console.log("UDL create start");
    const quize = this.cache.json.get("quize");
    const common = this.cache.json.get("common");
    const template = this.cache.json.get("template");
    const udl = this.cache.json.get("udl");
    this.createHtmlElements(udl, quize, common, template);
    const canvas = this.game.canvas;

    //  우클릭 활성화
    canvas?.addEventListener("contextmenu", function (e) {
      e.stopPropagation();
    });

    //  타이핑 focus 조정 활성화
    this.input?.on("pointerdown", (p) => {
      if (!document.activeElement.contains(p.target)) {
        document.getElementById("typing")?.blur();
      }
    });

    //  screenReader Focus 시, 활성화
    const screenReaderElements = document.querySelectorAll("#screenReader *");
    const quizeScene = this.scene.get("Quize");
    screenReaderElements.forEach((el) => {
      if (
        el.id?.includes("slctChoice") ||
        el.id?.includes("checkAnswer") ||
        el.id?.includes("tile") ||
        el.id?.includes("card")
      )
        el.addEventListener("focus", function () {
          const screenReader = document.getElementById("screenReader");
          screenReader.style.pointerEvents = "auto";
          el.style.pointerEvents = "auto";
        });

      if (
        el.id?.includes("slctChoice") ||
        el.id?.includes("checkAnswer") ||
        el.id?.includes("tile") ||
        el.id?.includes("card")
      )
        el.addEventListener("blur", function () {
          const screenReader = document.getElementById("screenReader");
          screenReader.style.pointerEvents = "none";
          el.style.pointerEvents = "none";
        });

      if (
        el.id?.includes("btnHint") ||
        el.id?.includes("btnMic") ||
        el.id?.includes("checkAnswer") ||
        el.id?.includes("reset")
      ) {
        el.addEventListener("focus", function () {
          const screenReader = document.getElementById("screenReader");
          screenReader.style.pointerEvents = "auto";
          el.style.pointerEvents = "auto";
          quizeScene.input.enabled = false;
        });

        el.addEventListener("blur", function () {
          const screenReader = document.getElementById("screenReader");
          screenReader.style.pointerEvents = "none";
          el.style.pointerEvents = "none";
          quizeScene.input.enabled = true;
        });
      }
    });
    console.log("UDL create complete");
  }

  async createHtmlElements(udl, quize, common, template) {
    const gameContainer = document.getElementById("game-container");
    const quizeScene = this.scene.get("Quize");

    // Check if elements already exist and remove them if they do
    const existingWrap = document.getElementById("wrap");
    if (existingWrap) {
      existingWrap.remove();
    }

    const existingScreenReader = document.getElementById("screenReader");
    if (existingScreenReader) {
      existingScreenReader.remove();
    }

    // 문제 wrap dom:show
    const wrap = document.createElement("div");
    wrap.id = "wrap";
    wrap.tabIndex = -1;
    wrap.ariaHidden = true;

    const feedback = document.createElement("div");
    feedback.id = "feedback";
    feedback.className = "feedback";
    wrap.appendChild(feedback);

    // 문제 텍스트 dom:show
    const question = document.createElement("div");
    question.id = "question";
    question.innerText = quize.question;
    question.ariaHidden = true;
    question.tabIndex = -1;
    wrap.appendChild(question);

    // 문제 텍스트 하위요소 dom hidden 처리
    const questionChild = question.querySelectorAll("*");
    question.ariaHidden = true;
    questionChild.forEach((el) => {
      el.setAttribute("tabindex", -1);
      el.setAttribute("aria-hidden", "true");
    });

    // 스크린리더용 dom:hidden
    const screenReader = document.createElement("div");
    screenReader.id = "screenReader";
    screenReader.className = "hidden";

    gameContainer.appendChild(wrap);
    gameContainer.appendChild(screenReader);
    handleScale();

    // 선지 이미지 alt 저장용
    const choiceImgsAltList = [];
    const qImgsAltList = [];

    //  스크린리더: 문제 텍스트 element 생성파트
    this.createQuestionText(screenReader, quize, common);

    //  스크린리더: 문제 음원 element 생성파트
    if (quize.questionVoice) {
      this.createAudioQ(screenReader, quizeScene, common);
    }

    //  스크린리더: udl.json 생성 구간
    udl &&
      udl.map((list) => {
        if (list === null || list === undefined) return;

        const data = Object.entries(list);
        const domTag = data?.[0]?.[0] || "";
        const alt = data?.[0]?.[1] || "";

        if (domTag === "텍스트" && alt) {
          const interval = setInterval(() => {
            const questionTxt = document.getElementById("questionTitle");

            if (questionTxt) {
              clearInterval(interval);
              questionTxt.innerText = questionTxt.innerText + ` ${alt}`;
            }
          }, 50);
        } else if (domTag === "제시 이미지") {
          qImgsAltList.push(alt);
        } else if (domTag === "선지 이미지") {
          choiceImgsAltList.push(alt);
        } else if (domTag === "배경 음악 켜기") {
          this.bgmPosition = alt === "top" ? "top" : "bot";
        }
      });

    if (qImgsAltList.length > 1 || quize.type.includes("A2")) {
      this.createQuestionMultImg(screenReader, template, qImgsAltList);
    } else if (qImgsAltList.length === 1) {
      this.createQuestionImg(screenReader, template, qImgsAltList[0]);
    }

    //  스크린리더: 문제 보기 element 생성파트
    if (quize.exampleTxt) {
      this.createExampleBox(screenReader, quize, template);
    }

    //  스크린리더: 문제 제시어 element 생성파트
    if (
      quize.questionTxt &&
      !quize.type.includes("A1") &&
      !quize.type.includes("A2") &&
      !quize.type.includes("A3") &&
      !quize.type.includes("A4")
    ) {
      this.createQuestionLetter(screenReader, quize, template);
    }

    //  스크린리더: 문제 STT 힌트 생성파트
    if (quize.hint) {
      this.createHint(screenReader, quizeScene, quize, template);
    }

    //  스크린리더: 문제 STT 마이크버튼 생성파트(상단 position)
    if (quizeScene.stt && !quize.type.includes("A2")) {
      this.createStt(screenReader, quizeScene, quize, template);
    }

    //  스크린리더: bgm 버튼 생성 구간(상단 position)
    if (this.bgmPosition === "top") {
      this.createBgm(screenReader, quizeScene, common);
    }

    //  스크린리더: 타이핑 생성 구간
    if (
      quize.type === "W2H" ||
      quize.type === "W2H2" ||
      quize.type === "W2H5" ||
      quize.type === "W2M" ||
      quize.type === "W2M2" ||
      quize.type === "W2M3" ||
      quize.type === "W43" ||
      quize.type === "W44"
    ) {
      this.isTyping = true;
      await this.createTyping(screenReader, quizeScene, template, quize);
    }

    //  스크린리더: 카드 퀴즈 생성 구간
    if (quize.card && quize.cardSpace) {
      await this.createCardQuize(screenReader, quizeScene, template, quize);
    }

    //  스크린리더: 선지 버튼 생성 구간
    if (quize.choice && quize.choice?.length > 0) {
      this.createChoice(
        screenReader,
        quizeScene,
        quize,
        common,
        template,
        choiceImgsAltList
      );
    }

    //  스크린리더: bgm 버튼 생성 구간(하단 position)
    if (this.bgmPosition === "bot") {
      this.createBgm(screenReader, quizeScene, common);
    }

    //  스크린리더: 문제 STT 마이크버튼 생성파트(하단 position)
    if (quizeScene.stt && quize.type.includes("A2")) {
      this.createStt(screenReader, quizeScene, quize, template);
    }

    //  스크린리더: 리셋 버튼 생성 구간
    if (
      quize?.type?.includes("S") ||
      quize?.type?.includes("W1") ||
      quize?.type?.includes("W3") ||
      quize?.type === "W4" ||
      quize?.type === "W2H3" ||
      quize?.type === "W2H4" ||
      quize?.type === "W2M4" ||
      quize?.type === "W2M5" ||
      quize?.type?.includes("P3") ||
      quize?.type?.includes("A2")
    ) {
      this.createReset(screenReader, quizeScene, common);
    }

    //  스크린리더: 정답확인 버튼 생성 구간
    this.createCheckAnswer(screenReader, quizeScene, common);
  }

  //  문제 제목 El
  createQuestionText(parent, quize, common) {
    const dom = document.createElement("div");
    const styleTitle = common?.style?.title;

    this.createCommonDom(
      dom,
      "questionTitle",
      this.wrapEnglishWithSpan(quize?.question || "")
    );
    this.convertTitleScale(dom, styleTitle);
    parent.appendChild(dom);
  }

  //  문제 이미지 El
  createQuestionImg(parent, template, alt) {
    const dom = document.createElement("div");
    const styleImg = template?.style?.card?.question;

    this.createCommonDom(
      dom,
      "questionImage",
      this.wrapEnglishWithSpan(`문제 제시 이미지 ${alt}`)
    );
    this.convertCommonImgScale(dom, styleImg);
    parent.appendChild(dom);
  }

  createQuestionMultImg(parent, template, altList) {
    altList.map((alt, i) => {
      const dom = document.createElement("div");
      const styleImg = template?.style?.card?.question;

      this.createCommonDom(
        dom,
        "questionImage",
        this.wrapEnglishWithSpan(`문제 제시 이미지 ${alt}`)
      );
      this.convertCommonImgGroupScale(
        dom,
        styleImg?.img?.width,
        styleImg?.img?.height,
        styleImg?.img?.position[i]?.x,
        styleImg?.img?.position[i]?.y
      );
      parent.appendChild(dom);
    });
  }

  //  문제 보기박스 El
  createExampleBox(parent, quize, template) {
    const dom = document.createElement("div");
    const styleExample =
      template?.style?.example || template?.style?.card?.question?.textBox;

    this.createCommonDom(
      dom,
      "questionExample",
      this.wrapEnglishWithSpan(`보기는 다음과 같습니다. ${quize.exampleTxt}`)
    );
    this.convertQuestTxtScale(dom, styleExample);
    parent.appendChild(dom);
  }

  //  문제 제시어 El
  createQuestionLetter(parent, quize, template) {
    const dom = document.createElement("div");
    const styleQuestion = template?.style?.card?.question;

    this.createCommonDom(
      dom,
      "questionLetter",
      `제시어 ${this.wrapEnglishWithSpan(
        quize.questionTxt?.replace("_", "빈칸")
      )}`
    );
    this.convertQuestTxtScale(dom, styleQuestion);
    parent.appendChild(dom);
  }

  //  문제 오디오 버튼 El
  createAudioQ(parent, quizeScene, common) {
    const btn = document.createElement("button");
    const styleBtnAudioQ = common?.style?.audio?.question;

    btn.id = `questionAudio`;
    btn.innerText = "문제 음원 듣기";
    btn.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        e.stopPropagation();

        if (quizeScene && quizeScene.audioBtnQ) {
          quizeScene.audioBtnQ.emit("pointerdown");
        }
      }
    });
    btn.addEventListener("focus", () => {
      setTimeout(() => {
        btn.innerText = "";
      }, 50);
    });
    btn.addEventListener("blur", () => {
      btn.innerText = "문제 음원 듣기";
    });

    this.convertCommonDomScale(btn, styleBtnAudioQ);
    parent.appendChild(btn);
  }

  async createCardQuize(parent, quizeScene, template, quize) {
    await new Promise((resolve) => {
      const interval = setInterval(() => {
        if (initComplete) {
          clearInterval(interval);
          resolve();
        }
      }, 50);
    });

    if (quizeScene?.dropBoxes && quizeScene?.tImages) {
      for (let i = 0; i < quizeScene.dropBoxes?.length; i++) {
        const btn = document.createElement(
          quizeScene.dropBoxes[i].getData("text") ? "div" : "button"
        );
        const styleTile = template.style.dropBox;
        const x = quizeScene.dropBoxes[i].x;
        const y = quizeScene.dropBoxes[i].y;
        const alt = `${i + 1} 타일자리`;

        btn.id = `tile${i + 1}`;
        btn.innerText = alt;
        btn.style.background = "transparent";
        if (!quizeScene.dropBoxes[i].getData("text")) {
          btn.addEventListener("keydown", (e) => {
            if (e.key === "Enter" || e.key === " ") {
              quizeScene.dropBoxes[i]?.emit("pointerdown");
              const box = quizeScene.dropBoxes[i];
              const boxText = box.getData("text");
              btn.innerHTML = boxText
                ? alt +
                  ":" +
                  `카드 <span role="text" class="notranslate">${boxText}</span> 존재합니다`
                : alt;

              this.cardList.map((dom, idx) => {
                const img = quizeScene.tImages?.[idx];

                if (img) {
                  const dropIdx = img.getData("dropIdx");
                  const cardTxt = img.getData("text");
                  const innerText = dom.innerText.includes(":")
                    ? dom.innerText.split(":")[0]
                    : dom.innerText;

                  dom.innerHTML = dom.innerHTML =
                    dropIdx !== null
                      ? this.wrapEnglishWithSpan(innerText) +
                        ":" +
                        `타일 ${dropIdx + 1} 에 위치`
                      : `카드 <span role="text" class="notranslate">${cardTxt}</span>`;
                }
              });
            }
          });

          btn.addEventListener("click", (e) => {
            const box = quizeScene.dropBoxes[i];
            const boxText = box.getData("text");
            btn.innerHTML = boxText
              ? alt +
                ":" +
                `카드 <span role="text" class="notranslate">${boxText}</span> 존재합니다`
              : alt;

            this.cardList.map((dom, idx) => {
              const img = quizeScene.tImages?.[idx];

              if (img) {
                const dropIdx = img.getData("dropIdx");
                const cardTxt = img.getData("text");
                const innerText = dom.innerText.includes(":")
                  ? dom.innerText.split(":")[0]
                  : dom.innerText;

                dom.innerHTML = dom.innerHTML =
                  dropIdx !== null
                    ? this.wrapEnglishWithSpan(innerText) +
                      ":" +
                      `타일 ${dropIdx + 1} 에 위치`
                    : `카드 <span role="text" class="notranslate">${cardTxt}</span>`;
              }
            });
          });
        } else {
          btn.tabIndex = 0;
          btn.innerHTML = `타일 제시어 <span role="text" class="notranslate">${quizeScene.dropBoxes[
            i
          ].getData("text")}</span>`;
        }

        if (
          (quize?.type === "W13" ||
            quize?.type === "W16" ||
            quize?.type === "W33") &&
          i === 0
        ) {
          if (quize?.txtSpace) {
            const split = quize?.txtSpace.split(",");
            let front = "";

            split &&
              split.map((txt) => {
                if (txt !== "0") {
                  front = txt;
                }
              });

            if (front) {
              const cardImg = document.createElement("div");
              const x = quizeScene.dropBoxes[i].x;
              const y = quizeScene.dropBoxes[i].y;

              cardImg.id = `cardImg`;
              cardImg.tabIndex = 0;
              cardImg.innerHTML = this.wrapEnglishWithSpan(`수식어 ${front}`);
              cardImg.style.pointerEvents = "none";
              cardImg.setAttribute("role", "text");

              this.convertCardScale(
                cardImg,
                styleTile,
                x - (styleTile?.width || 0),
                y
              );
              parent.appendChild(cardImg);
            }
          }
        }

        this.tileList.push(btn);
        this.convertCardScale(btn, styleTile, x, y);
        parent.appendChild(btn);
      }

      for (let i = 0; i < quizeScene.tImages?.length; i++) {
        const btn = document.createElement(
          quizeScene.tImages[i].getData("fixed") ? "div" : "button"
        );
        const styleTile = template.style.dragBox;
        const x = quizeScene.tImages[i].x;
        const y = quizeScene.tImages[i].y;
        const cardTxt = quizeScene.tImages[i].getData("text");

        btn.id = `card${i + 1}`;
        btn.innerHTML = `카드 <span role="text" class="notranslate">${cardTxt}</span>`;
        btn.style.background = "transparent";
        if (!quizeScene.tImages[i].getData("fixed")) {
          btn.addEventListener("keydown", (e) => {
            if (e.key === "Enter" || e.key === " ") {
              quizeScene.tImages[i]?.emit("pointerdown");
              const img = quizeScene.tImages?.[i];

              if (quizeScene.dropBoxes) {
                this.tileList.map((dom, idx) => {
                  const box = quizeScene.dropBoxes?.[idx];

                  if (box) {
                    const boxText = box.getData("text");
                    const innerText = dom.innerText.includes(":")
                      ? dom.innerText.split(":")[0]
                      : dom.innerText;

                    dom.innerHTML = boxText
                      ? this.wrapEnglishWithSpan(innerText) +
                        ":" +
                        `카드 <span role="text" class="notranslate">${boxText}</span>가 존재합니다`
                      : this.wrapEnglishWithSpan(innerText);
                  }
                });
              }

              if (img) {
                const dropIdx = img.getData("dropIdx");
                const innerText = btn.innerText.includes(":")
                  ? btn.innerText.split(":")[0]
                  : btn.innerText;

                btn.innerHTML =
                  dropIdx !== null
                    ? this.wrapEnglishWithSpan(innerText) +
                      ":" +
                      `타일 ${dropIdx + 1} 에 위치`
                    : quizeScene?.currentCard?.getData("startX") ===
                      img.getData("startX")
                    ? `${this.wrapEnglishWithSpan(innerText)}: 선택됨`
                    : this.wrapEnglishWithSpan(innerText);
              }
            }
          });

          btn.addEventListener("click", (e) => {
            const img = quizeScene.tImages?.[i];

            if (quizeScene.dropBoxes) {
              this.tileList.map((dom, idx) => {
                const box = quizeScene.dropBoxes?.[idx];

                if (box) {
                  const boxText = box.getData("text");
                  const innerText = dom.innerText.includes(":")
                    ? dom.innerText.split(":")[0]
                    : dom.innerText;

                  dom.innerHTML = boxText
                    ? this.wrapEnglishWithSpan(innerText) +
                      ":" +
                      `카드 <span role="text" class="notranslate">${boxText}</span>가 존재합니다`
                    : this.wrapEnglishWithSpan(innerText);
                }
              });
            }

            if (img) {
              const dropIdx = img.getData("dropIdx");
              const innerText = btn.innerText.includes(":")
                ? btn.innerText.split(":")[0]
                : btn.innerText;

              btn.innerHTML =
                dropIdx !== null
                  ? this.wrapEnglishWithSpan(innerText) +
                    ":" +
                    `타일 ${dropIdx + 1} 에 위치`
                  : quizeScene?.currentCard?.getData("startX") ===
                    img.getData("startX")
                  ? `${this.wrapEnglishWithSpan(innerText)}: 선택됨`
                  : this.wrapEnglishWithSpan(innerText);
            }
          });
        } else {
          btn.tabIndex = -1;
          btn.ariaHidden = true;
        }

        this.cardList.push(btn);
        this.convertCardScale(btn, styleTile, x, y);
        parent.appendChild(btn);
      }
    }
  }

  async createTyping(parent, quizeScene, template, quize) {
    const dom = document.createElement("div");
    const input = document.createElement("input");
    const styleSchetch = template?.style?.schetch;
    const type = quize.type;
    const txtSpace = quize?.txtSpace;
    const txtSpaceSplit = quize?.txtSpace?.split(",");
    let addTxt = " ";

    if (type === "W2H2" || type === "W2M2") {
      addTxt = txtSpace ? ` 제시어 ${txtSpace?.replace("0", "빈칸")}` : "";
    } else if (type === "W43") {
      addTxt = ` 제시어 ${quize.answer}`;
    } else if (type === "W2H5" || type === "W2M3" || type === "W44") {
      const arr = this.splitAnswerBySpace(quize);

      txtSpaceSplit &&
        txtSpaceSplit.map((txt, i) => {
          if (txt === "0") {
            addTxt += ` 제시어 ${arr[i]},`;
          } else {
            addTxt += ` 고정제시어 ${txt},`;
          }
        });
    } else {
      addTxt = "";
    }

    dom.id = "schetch";
    input.id = "typing";
    input.type = "text";
    input.style.pointerEvents = "auto";
    input.setAttribute("title", `문자입력을 해주세요.${addTxt}`);

    input.addEventListener("input", (e) => {
      if (!quizeScene.check) {
        quizeScene.userAnswer = e.target.value;
        quizeScene.inputText.text = e.target.value;

        if (quizeScene.userAnswer.length > 0) {
          quizeScene.checkAnswerBtn.setVisible(true);
        } else {
          quizeScene.checkAnswerBtn.setVisible(false);
        }
      }
    });

    input.addEventListener("focus", () => {
      if (!quizeScene.check) {
        input.value = quizeScene.inputText.text;
      } else {
        input.setAttribute(
          "title",
          `정답제출이 끝났습니다. 타이핑:${quizeScene.userAnswer}`
        );
        input.blur();
      }
    });

    input.addEventListener("keydown", (e) => {
      if (e.key === "Tab" || e.key === "Enter") {
        return;
      }

      e.preventDefault();
      e.stopPropagation();

      console.log("dom input down");
      if (quizeScene.keyListener) {
        quizeScene.keyListener(e);
        input.value = quizeScene.inputText.text;
      }
    });

    dom.addEventListener("click", () => {
      if (document.activeElement !== input && !quizeScene.check) {
        input.focus();
      }
    });

    this.convertTypingScale(dom, input, styleSchetch);
    dom.appendChild(input);
    parent.appendChild(dom);

    // 씬 종료 시 이벤트 핸들러 정리
    this.events.on("shutdown", () => {
      dom.removeChild(input);
      parent.removeChild(dom);
    });

    this.inputArea = input;
  }

  createChoice(parent, quizeScene, quize, common, template, choiceImgsAltList) {
    const styleCard = template?.style?.card?.choice;
    let initX = 0;
    let alignVertical = false;
    for (let i = 0; i < styleCard?.length; i++) {
      if (!initX) initX = styleCard[i].x;
      else if (initX === styleCard[i].x) {
        alignVertical = true;
        break;
      }
    }
    if (alignVertical) {
      quize.choice.map((choice, i) => {
        if (choice?.image && choiceImgsAltList[i]) {
          this.createChoiceImg(parent, i, template, choiceImgsAltList);
        }

        if (choice?.audio) {
          this.createChoiceAudio(parent, i, quizeScene, template);
        }

        if (choice?.text) {
          this.createChoiceTxt(parent, i, template, choice?.text);
        }

        let ignoreClick = false;
        const label = document.createElement("label");
        const radio = document.createElement("input");
        const styleBtnCheckBox = common?.style?.btnCheckBox;
        const styleChoice = template?.style?.card?.choice[i];
        const styleRadio = template?.style?.card?.choice[i]?.checkbox;
        const isOx =
          choice.value === "O" || choice.value === "X" ? true : false;

        label.setAttribute("for", `slctChoice${i + 1}`);
        radio.type = "radio";
        radio.name = `slctChoice`;
        radio.id = `slctChoice${i + 1}`;
        radio.setAttribute(
          "aria-label",
          isOx ? `${choice.value} 선택지` : `${i + 1} 선택지`
        );

        if (isOx && !this.isOx) this.isOx = true;

        const interval = setInterval(() => {
          if (initComplete) {
            clearInterval(interval);
            if (initData && initData?.answer && (initData?.input || this.stt)) {
              if (i + 1 === initData?.input) {
                radio.checked = true;
              }
            }
          }
        }, 100);

        this.convertRadioScale(
          label,
          radio,
          styleBtnCheckBox,
          styleChoice,
          styleRadio
        );

        this.choiceChk.push(radio);

        radio.addEventListener("click", (e) => {
          if (ignoreClick) {
            ignoreClick = false;
            e.preventDefault();
            e.stopPropagation();
            return;
          }

          const originalChecked = radio.checked;

          if (
            quizeScene &&
            quizeScene.choiceCheckbox &&
            quizeScene.choiceCheckbox[i]
          ) {
            if (quizeScene.check) {
              //  상태1
              this.showModal(
                parent,
                "이미 정답이 제출되어있습니다. 결과확인버튼을 눌러 확인해주세요"
              );
              e.preventDefault();
              e.stopPropagation();
              radio.checked = originalChecked;
            } else if (
              quize?.questionVoice &&
              !quizeScene.groupSounds?.audioQuestion &&
              choice?.audio &&
              !quizeScene.groupSounds?.audioChoice?.[`choice${i + 1}`]
            ) {
              //  상태2
              this.showModal(
                parent,
                `문제음원과 ${i + 1} 선택지 음원을 들어주세요`
              );
              e.preventDefault();
              e.stopPropagation();
              radio.checked = originalChecked;
            } else if (
              quize?.questionVoice &&
              !quizeScene.groupSounds?.audioQuestion
            ) {
              //  상태3
              this.showModal(parent, "문제 음원을 들어주세요");
              e.preventDefault();
              e.stopPropagation();
              radio.checked = originalChecked;
            } else if (
              choice?.audio &&
              !quizeScene.groupSounds?.audioChoice?.[`choice${i + 1}`]
            ) {
              //  상태4
              this.showModal(parent, `${i + 1} 선택지 음원을 들어주세요`);
              e.preventDefault();
              e.stopPropagation();
              radio.checked = originalChecked;
            } else {
              radio.checked = true;
            }
          }
        });

        radio.addEventListener("keydown", (e) => {
          ignoreClick = true;

          if (e.key === "Enter" || e.key === " ") {
            const originalChecked = radio.checked;

            if (
              quizeScene &&
              quizeScene.choiceCheckbox &&
              quizeScene.choiceCheckbox[i]
            ) {
              quizeScene.choiceCheckbox[i].emit("pointerdown");

              if (quizeScene.check) {
                //  상태1
                this.showModal(
                  parent,
                  "이미 정답이 제출되어있습니다. 결과확인버튼을 눌러 확인해주세요"
                );
                e.preventDefault();
                e.stopPropagation();
                radio.checked = originalChecked;
              } else if (
                quize?.questionVoice &&
                !quizeScene.groupSounds?.audioQuestion &&
                choice?.audio &&
                !quizeScene.groupSounds?.audioChoice?.[`choice${i + 1}`]
              ) {
                //  상태2
                this.showModal(
                  parent,
                  `문제음원과 ${i + 1} 선택지 음원을 들어주세요`
                );
                e.preventDefault();
                e.stopPropagation();
                radio.checked = originalChecked;
              } else if (
                quize?.questionVoice &&
                !quizeScene.groupSounds?.audioQuestion
              ) {
                //  상태3
                this.showModal(parent, "문제 음원을 들어주세요");
                e.preventDefault();
                e.stopPropagation();
                radio.checked = originalChecked;
              } else if (
                choice?.audio &&
                !quizeScene.groupSounds?.audioChoice?.[`choice${i + 1}`]
              ) {
                //  상태4
                this.showModal(parent, `${i + 1} 선택지 음원을 들어주세요`);
                e.preventDefault();
                e.stopPropagation();
                radio.checked = originalChecked;
              } else {
                radio.checked = true;
              }
            }
          }
        });

        parent.appendChild(label);
        parent.appendChild(radio);
      });
    } else {
      //  선지 음원버튼 생성구간
      if (quize.choice?.[0]?.audio) {
        quize.choice.map((choice, i) => {
          if (choice?.audio) {
            this.createChoiceAudio(parent, i, quizeScene, template);
          }
        });
      }

      //  선지 이미지 생성구간
      if (quize.choice?.[0]?.image) {
        quize.choice.map((choice, i) => {
          if (choice?.image && choiceImgsAltList[i]) {
            this.createChoiceImg(parent, i, template, choiceImgsAltList);
          }
        });
      }

      //  선지 제시어 생성구간
      if (quize.choice?.[0]?.text) {
        quize.choice.map((choice, i) => {
          if (choice?.text) {
            this.createChoiceTxt(parent, i, template, choice?.text);
          }
        });
      }

      //  선지 라디오버튼 생성구간
      this.createChoiceRadio(parent, quizeScene, quize, common, template);
    }
  }

  //  선택 이미지 El
  createChoiceImg(parent, idx, template, choiceImgsAltList) {
    const dom = document.createElement("div");
    const styleImg = template?.style?.card?.choice[idx]?.img;

    this.createCommonDom(
      dom,
      `choiceImage${idx + 1}`,
      this.wrapEnglishWithSpan(
        `${idx + 1}선택지 제시 이미지 ${choiceImgsAltList[idx]}`
      )
    );
    this.convertCommonDomScale(dom, styleImg);
    parent.appendChild(dom);
  }

  //  선택 오디오 버튼 El
  createChoiceAudio(parent, idx, quizeScene, template) {
    const btn = document.createElement("button");
    const styleBtnAudio = template?.style?.card?.choice[idx];

    btn.id = `choiceAudio${idx + 1}`;
    btn.innerText = `${idx + 1} 선택지 음원 듣기`;
    btn.title = `${idx + 1} 선택지 음원 듣기`;
    btn.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        e.stopPropagation();

        if (
          quizeScene &&
          quizeScene.choiceBtnAudioLayer &&
          quizeScene.choiceBtnAudioLayer[`choice${idx + 1}`]
        ) {
          quizeScene.choiceBtnAudioLayer[`choice${idx + 1}`].emit(
            "pointerdown"
          );
        }
      }
    });

    btn.addEventListener("focus", () => {
      setTimeout(() => {
        btn.innerText = "";
        btn.title = "";
      }, 50);
    });
    btn.addEventListener("blur", () => {
      btn.innerText = `${idx + 1} 선택지 음원 듣기`;
      btn.title = `${idx + 1} 선택지 음원 듣기`;
    });

    this.convertBtnAudioScale(btn, styleBtnAudio);
    parent.appendChild(btn);
  }

  //  선택 텍스트 버튼 El
  createChoiceTxt(parent, idx, template, txt) {
    const dom = document.createElement("div");
    const styleChoice = template?.style?.card?.choice[idx];

    this.createCommonDom(
      dom,
      `choiceTxt${idx + 1}`,
      this.wrapEnglishWithSpan(`${idx + 1} 선택지 제시어: ${txt}`)
    );
    this.convertChoiceTxtScale(dom, styleChoice);
    parent.appendChild(dom);
  }

  createChoiceRadio(parent, quizeScene, quize, common, template) {
    let ignoreClick = false;
    quize.choice.map((choice, i) => {
      const label = document.createElement("label");
      const radio = document.createElement("input");
      const styleBtnCheckBox = common?.style?.btnCheckBox;
      const styleChoice = template?.style?.card?.choice[i];
      const styleRadio = template?.style?.card?.choice[i]?.checkbox;
      const isOx = choice.value === "O" || choice.value === "X" ? true : false;

      label.setAttribute("for", `slctChoice${i + 1}`);
      radio.type = "radio";
      radio.name = `slctChoice`;
      radio.id = `slctChoice${i + 1}`;
      radio.setAttribute(
        "aria-label",
        isOx ? `${choice.value} 선택지` : `${i + 1} 선택지`
      );

      if (isOx && !this.isOx) this.isOx = true;

      const interval = setInterval(() => {
        if (initComplete) {
          clearInterval(interval);
          if (initData && initData?.answer && (initData?.input || this.stt)) {
            if (i + 1 === initData?.input) {
              radio.checked = true;
            }
          }
        }
      }, 100);

      this.convertRadioScale(
        label,
        radio,
        styleBtnCheckBox,
        styleChoice,
        styleRadio
      );

      this.choiceChk.push(radio);

      radio.addEventListener("click", (e) => {
        if (ignoreClick) {
          ignoreClick = false;
          e.preventDefault();
          e.stopPropagation();
          return;
        }

        const originalChecked = radio.checked;

        if (
          quizeScene &&
          quizeScene.choiceCheckbox &&
          quizeScene.choiceCheckbox[i]
        ) {
          if (quizeScene.check) {
            //  상태1
            this.showModal(
              parent,
              "이미 정답이 제출되어있습니다. 결과확인버튼을 눌러 확인해주세요"
            );
            e.preventDefault();
            e.stopPropagation();
            radio.checked = originalChecked;
          } else if (
            quize?.questionVoice &&
            !quizeScene.groupSounds?.audioQuestion &&
            choice?.audio &&
            !quizeScene.groupSounds?.audioChoice?.[`choice${i + 1}`]
          ) {
            //  상태2
            this.showModal(
              parent,
              `문제음원과 ${i + 1} 선택지 음원을 들어주세요`
            );
            e.preventDefault();
            e.stopPropagation();
            radio.checked = originalChecked;
          } else if (
            quize?.questionVoice &&
            !quizeScene.groupSounds?.audioQuestion
          ) {
            //  상태3
            this.showModal(parent, "문제 음원을 들어주세요");
            e.preventDefault();
            e.stopPropagation();
            radio.checked = originalChecked;
          } else if (
            choice?.audio &&
            !quizeScene.groupSounds?.audioChoice?.[`choice${i + 1}`]
          ) {
            //  상태4
            this.showModal(parent, `${i + 1} 선택지 음원을 들어주세요`);
            e.preventDefault();
            e.stopPropagation();
            radio.checked = originalChecked;
          } else {
            radio.checked = true;
          }
        }
      });

      radio.addEventListener("keydown", (e) => {
        ignoreClick = true;

        if (e.key === "Enter" || e.key === " ") {
          const originalChecked = radio.checked;

          if (
            quizeScene &&
            quizeScene.choiceCheckbox &&
            quizeScene.choiceCheckbox[i]
          ) {
            quizeScene.choiceCheckbox[i].emit("pointerdown");

            if (quizeScene.check) {
              //  상태1
              this.showModal(
                parent,
                "이미 정답이 제출되어있습니다. 결과확인버튼을 눌러 확인해주세요"
              );
              e.preventDefault();
              e.stopPropagation();
              radio.checked = originalChecked;
            } else if (
              quize?.questionVoice &&
              !quizeScene.groupSounds?.audioQuestion &&
              choice?.audio &&
              !quizeScene.groupSounds?.audioChoice?.[`choice${i + 1}`]
            ) {
              //  상태2
              this.showModal(
                parent,
                `문제음원과 ${i + 1} 선택지 음원을 들어주세요`
              );
              e.preventDefault();
              e.stopPropagation();
              radio.checked = originalChecked;
            } else if (
              quize?.questionVoice &&
              !quizeScene.groupSounds?.audioQuestion
            ) {
              //  상태3
              this.showModal(parent, "문제 음원을 들어주세요");
              e.preventDefault();
              e.stopPropagation();
              radio.checked = originalChecked;
            } else if (
              choice?.audio &&
              !quizeScene.groupSounds?.audioChoice?.[`choice${i + 1}`]
            ) {
              //  상태4
              this.showModal(parent, `${i + 1} 선택지 음원을 들어주세요`);
              e.preventDefault();
              e.stopPropagation();
              radio.checked = originalChecked;
            } else {
              radio.checked = true;
            }
          }
        }
      });

      // label.appendChild(radio);
      parent.appendChild(label);
      parent.appendChild(radio);
    });
  }

  createStt(parent, quizeScene, quize, template) {
    if (
      initData?.answer &&
      initData.input &&
      initData?.answer === initData.input
    )
      return;
    const btn = document.createElement("button");
    const styleBtnMic = template?.style?.card?.choice?.mic;
    this.stateAlt.mic =
      initData?.answer && initData.input ? "정답음원 듣기" : "녹음하기";
    btn.id = `btnMic`;
    btn.innerText = this.stateAlt.mic;
    btn.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        e.stopPropagation();

        if (this.stateAlt.mic === "정답음원 듣기") {
          if (quizeScene && quizeScene?.btnAnswerPlay) {
            quizeScene.btnAnswerPlay.emit("pointerdown");
            quizeScene.btnAnswerPlay.emit("pointerup");
          }
        } else {
          if (quizeScene && quizeScene.btnRecord) {
            if (quize?.questionVoice) {
              if (quizeScene?.groupSounds?.audioQuestion) {
                quizeScene.btnRecord.emit("pointerup");
              } else {
                this.showModal(parent, `문제음원을 들어주세요`);
              }
            } else {
              quizeScene.btnRecord.emit("pointerup");
            }
          }
        }
      }
    });

    btn.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();

      if (this.stateAlt.mic === "정답음원 듣기") {
        if (quizeScene && quizeScene?.btnAnswerPlay) {
          quizeScene.btnAnswerPlay.emit("pointerdown");
          quizeScene.btnAnswerPlay.emit("pointerup");
        }
      } else {
        if (quizeScene && quizeScene.btnRecord) {
          if (quize?.questionVoice) {
            if (quizeScene?.groupSounds?.audioQuestion) {
              quizeScene.btnRecord.emit("pointerup");
            } else {
              this.showModal(parent, `문제음원을 들어주세요`);
            }
          } else {
            quizeScene.btnRecord.emit("pointerup");
          }
        }
      }
    });

    btn.addEventListener("focus", () => {
      this.stateAlt.mic =
        (initData?.answer && initData.input) || this.sendCheck
          ? "정답음원 듣기"
          : "녹음하기";

      btn.innerText = this.stateAlt.mic;
      setTimeout(() => {
        btn.innerText = "";
      }, 50);
    });

    btn.addEventListener("blur", () => {
      this.stateAlt.mic =
        (initData?.answer && initData.input) || this.sendCheck
          ? "정답음원 듣기"
          : "녹음하기";

      btn.innerText = this.stateAlt.mic;
    });

    if (quize.type.includes("A2")) this.convertCommonDomScale(btn, styleBtnMic);
    else this.convertBtnMicScale(btn, styleBtnMic, quize);
    parent.appendChild(btn);
  }

  createHint(parent, quizeScene, quize, template) {
    const btn = document.createElement("button");
    const styleBtnHint = template?.style?.card?.choice?.hint;

    btn.id = `btnHint`;
    btn.innerText = "힌트보기";
    btn.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        e.stopPropagation();

        if (quizeScene?.btnHint) quizeScene.btnHint.emit("pointerdown");
        this.showModalHint(parent, quize.hint, template, quizeScene);
      }
    });

    btn.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      if (quizeScene?.btnHint) quizeScene.btnHint.emit("pointerdown");
      this.showModalHint(parent, quize.hint, template, quizeScene);
    });

    this.convertCommonDomScale(btn, styleBtnHint);
    parent.appendChild(btn);
  }

  //  배경 BGM 버튼 El
  createBgm(parent, quizeScene, common) {
    const btn = document.createElement("button");
    const styleBtnBgm = common?.style?.btnBgm;

    btn.id = `btnBgm`;
    btn.title = this.stateAlt.bgm;
    btn.innerText = this.stateAlt.bgm;

    btn.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        e.stopPropagation();

        if (quizeScene && quizeScene.btnBgm) {
          quizeScene.btnBgm.emit("pointerdown");
        }
      }
    });

    btn.addEventListener("focus", () => {
      setTimeout(() => {
        btn.innerText = "";
        btn.title = "";
      }, 50);
    });

    btn.addEventListener("blur", () => {
      if (quizeScene && quizeScene.btnBgm) {
        const bgm = quizeScene.groupSounds?.bgm?.bgm;

        this.stateAlt.bgm = bgm?.isPlaying
          ? "배경 음악 끄기"
          : "배경 음악 켜기";
        btn.title = this.stateAlt.bgm;
        btn.innerText = this.stateAlt.bgm;
      }
    });

    this.convertCommonDomScale(btn, styleBtnBgm);
    parent.appendChild(btn);
  }

  createReset(parent, quizeScene, common) {
    const btn = document.createElement("button");
    const styleBtnReset = common?.style?.btnReset;

    btn.id = `reset`;
    btn.innerText = this.stateAlt.reset;
    btn.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        e.stopPropagation();
        if (this.sendCheck) return;
        if (quizeScene && quizeScene?.btnReset) {
          quizeScene.btnReset.emit("pointerdown");
          quizeScene.btnReset.emit("pointerup");
        }
        if (this.cardList.length > 0 && this.tileList.length > 0) {
          for (let i = 0; i < quizeScene.tImages?.length; i++) {
            const cardTxt = quizeScene.tImages[i].getData("text");
            this.cardList[i].innerText = `카드 ${cardTxt}`;
          }

          this.tileList.map((dom, i) => {
            dom.innerText = `${i + 1} 타일자리`;
          });
        }
      }
    });

    btn.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      if (this.sendCheck) return;
      if (quizeScene && quizeScene?.btnReset) {
        quizeScene.btnReset.emit("pointerdown");
        quizeScene.btnReset.emit("pointerup");
      }
      if (this.cardList.length > 0 && this.tileList.length > 0) {
        for (let i = 0; i < quizeScene.tImages?.length; i++) {
          const cardTxt = quizeScene.tImages[i].getData("text");
          this.cardList[i].innerText = `카드 ${cardTxt}`;
        }

        this.tileList.map((dom, i) => {
          dom.innerText = `${i + 1} 타일자리`;
        });
      }
    });

    this.convertCommonDomScale(btn, styleBtnReset);
    parent.appendChild(btn);
  }

  //  정답 확인 버튼 El
  createCheckAnswer(parent, quizeScene, common) {
    const btn = document.createElement("button");
    const styleBtnCheck = common?.style?.btnCheck;

    if (quizeScene.check) {
      this.stateAlt.checkAnswer = "결과 확인 하기";
    }
    btn.id = "checkAnswer";
    btn.innerText = this.stateAlt.checkAnswer;
    btn.addEventListener("keydown", (e) => {
      e.preventDefault();
      e.stopPropagation();

      if (e.key === "Enter" || e.key === " ") {
        if (quizeScene.stt && resultSttCloseType !== "result") {
          this.showModal(parent, "녹음을 진행해주세요");
          return;
        }

        if (quizeScene && quizeScene.checkAnswerBtn) {
          quizeScene.checkAnswerBtn.emit("pointerdown");

          if (quizeScene.userAnswer || quizeScene.stt) {
            const isCorrect = quizeScene.stt
              ? Number(resultSttScore) >= 70
              : quizeScene.userAnswer === quizeScene.template.answer
              ? true
              : false;

            this.stateAlt.checkAnswer = "결과 확인하기";
            btn.innerText = "결과 확인하기";

            if (isCorrect) {
              this.showResult(parent, `정답입니다.`);
            } else {
              this.showResult(
                parent,
                `오답입니다. 정답은 ${
                  quizeScene.stt
                    ? quizeScene.template.answerStt ||
                      quizeScene.template.answer
                    : this.isOx
                    ? quizeScene.template.answer === 1
                      ? "O"
                      : "X"
                    : quizeScene.template.answer
                } 입니다.`
              );
            }

            const btnReset = document.getElementById("reset");
            if (btnReset) btnReset.remove();
            if (quizeScene.stt) this.stateAlt.mic = "정답음원 듣기";
            if (this.inputArea && this.isTyping) {
              this.inputArea.setAttribute(
                "title",
                `정답제출이 끝났습니다. 타이핑:${quizeScene.userAnswer}`
              );
            }

            this.sendCheck = true;
          } else {
            this.showModal(
              parent,
              this.isTyping ? "정답을 입력해주세요" : "정답을 선택해주세요"
            );
          }
        }
      }
    });

    btn.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();

      if (quizeScene.stt && resultSttCloseType !== "result") {
        this.showModal(parent, "녹음을 진행해주세요");
        return;
      }

      if (quizeScene && quizeScene.checkAnswerBtn) {
        quizeScene.checkAnswerBtn.emit("pointerdown");

        if (quizeScene.userAnswer || quizeScene.stt) {
          const isCorrect = quizeScene.stt
            ? Number(resultSttScore) >= 70
            : quizeScene.userAnswer === quizeScene.template.answer
            ? true
            : false;

          this.stateAlt.checkAnswer = "결과 확인하기";
          btn.innerText = "결과 확인하기";

          if (isCorrect) {
            this.showResult(parent, `정답입니다.`);
          } else {
            this.showResult(
              parent,
              `오답입니다. 정답은 ${
                quizeScene.stt
                  ? quizeScene.template.answerStt || quizeScene.template.answer
                  : this.isOx
                  ? quizeScene.template.answer === 1
                    ? "O"
                    : "X"
                  : quizeScene.template.answer
              } 입니다.`
            );
          }

          const btnReset = document.getElementById("reset");
          if (btnReset) btnReset.remove();
          if (quizeScene.stt) this.stateAlt.mic = "정답음원 듣기";
          if (this.inputArea && this.isTyping) {
            this.inputArea.setAttribute(
              "title",
              `정답제출이 끝났습니다. 타이핑:${quizeScene.userAnswer}`
            );
          }

          this.sendCheck = true;
        } else {
          this.showModal(
            parent,
            this.isTyping ? "정답을 입력해주세요" : "정답을 선택해주세요"
          );
        }
      }
    });

    this.convertCommonDomScale(btn, styleBtnCheck);
    parent.appendChild(btn);
  }

  /*DOM STYLE : Positioning--------------START----------------*/
  convertCommonDomScale(element, style, x, y) {
    const scaleX = ((x || style.x || 0) / 1232) * 100;
    const scaleY = ((y || style.y || 0) / 625) * 100;
    const scaleW = ((style.width || 0) / 1232) * 100;
    const scaleH = ((style.height || 0) / 625) * 100;

    element.style.position = "absolute";
    element.style.top = `${scaleY}%`;
    element.style.left = `${scaleX}%`;
    element.style.width = `${scaleW}%`;
    element.style.height = `${scaleH}%`;
  }

  convertBtnMicScale(element, style, quize) {
    const scaleX = ((style.x || 0) / 1232) * 100;
    const scaleY =
      (((style.y || 0) - (quize?.hint ? 0 : (style.height || 0) / 2)) / 625) *
      100;
    const scaleW = ((style.width || 0) / 1232) * 100;
    const scaleH = ((style.height || 0) / 625) * 100;

    element.style.position = "absolute";
    element.style.top = `${scaleY}%`;
    element.style.left = `${scaleX}%`;
    element.style.width = `${scaleW}%`;
    element.style.height = `${scaleH}%`;
  }

  convertCommonImgScale(element, style) {
    const scaleX = ((style?.img?.x || style.x || 0) / 1232) * 100;
    const scaleY = ((style?.img?.y || style.y || 0) / 625) * 100;
    const scaleW = ((style.width || 0) / 1232) * 100;
    const scaleH = ((style.height || 0) / 625) * 100;

    element.style.position = "absolute";
    element.style.top = `${scaleY}%`;
    element.style.left = `${scaleX}%`;
    element.style.width = `${scaleW}%`;
    element.style.height = `${scaleH}%`;
  }

  convertCommonImgGroupScale(element, width, height, x, y) {
    const scaleX = ((x || 0) / 1232) * 100;
    const scaleY = ((y || 0) / 625) * 100;
    const scaleW = ((width || 0) / 1232) * 100;
    const scaleH = ((height || 0) / 625) * 100;

    element.style.position = "absolute";
    element.style.top = `${scaleY}%`;
    element.style.left = `${scaleX}%`;
    element.style.width = `${scaleW}%`;
    element.style.height = `${scaleH}%`;
  }

  convertTitleScale(element, style) {
    const scaleW = ((style.width || 0) / 1232) * 100;
    const scaleH = ((style.height || 0) / 625) * 100;
    const scaleX = 50 - scaleW / 2;
    const scaleY = (35 / 625) * 100;

    element.style.position = "absolute";
    element.style.top = `${scaleY}%`;
    element.style.left = `${scaleX}%`;
    element.style.width = `${scaleW}%`;
    element.style.height = `${scaleH}%`;
  }

  convertQuestTxtScale(element, styleQuestion) {
    const styleTxt = styleQuestion?.textBox;
    const scaleX = ((styleTxt?.x || styleQuestion.x || 0) / 1232) * 100;
    const scaleY = ((styleTxt?.y || styleQuestion.y || 0) / 625) * 100;
    const scaleW = ((styleTxt?.width || styleQuestion.width || 0) / 1232) * 100;
    const scaleH =
      ((styleTxt?.height || styleQuestion.height || 0) / 625) * 100;

    element.style.position = "absolute";
    element.style.top = `${scaleY}%`;
    element.style.left = `${scaleX}%`;
    element.style.width = `${scaleW}%`;
    element.style.height = `${scaleH}%`;
  }

  convertCardScale(element, style, x, y) {
    const scaleX = ((x || 0) / 1232) * 100;
    const scaleY = ((y || 0) / 625) * 100;
    const scaleW = ((style.width || 0) / 1232) * 100;
    const scaleH = ((style.height || 0) / 625) * 100;

    element.style.position = "absolute";
    element.style.top = `${scaleY}%`;
    element.style.left = `${scaleX}%`;
    element.style.width = `${scaleW}%`;
    element.style.height = `${scaleH}%`;
    element.style.transform = `translate(-50%, -50%)`;
  }

  convertChoiceTxtScale(element, style) {
    let scaleX =
      (((style.x || 0) + (style.width || 0) / 2 + (style?.txt?.x || 0)) /
        1232) *
      100;
    let scaleY =
      (((style.y || 0) + (style.height || 0) / 2 + (style?.txt?.y || 0)) /
        625) *
      100;
    const scaleW = ((style?.width || 0) / 1232) * 100;
    const scaleH = ((style?.txt?.font?.scaleTo || 18) / 625) * 100;

    element.style.position = "absolute";
    element.style.top = `${scaleY}%`;
    element.style.left = `${scaleX}%`;
    element.style.width = `${scaleW}%`;
    element.style.height = `${scaleH}%`;
    element.style.transform = `translate(-50%, -50%)`;
    element.style.margin = 0;
    element.style.padding = 0;
    element.tabIndex = 0;
  }

  convertBtnAudioScale(element, style) {
    const scaleX =
      (((style?.audio?.x || 0) + (style.x || 0) + (style.width || 0) / 2) /
        1232) *
      100;
    const scaleY =
      (((style?.audio?.y || 0) + (style.y || 0) + (style.height || 0) / 2) /
        625) *
      100;
    const scaleW = ((style.audio.width || 0) / 1232) * 80;
    const scaleH = ((style.audio.height || 0) / 625) * 80;

    element.style.position = "absolute";
    element.style.top = `${scaleY}%`;
    element.style.left = `${scaleX}%`;
    element.style.width = `${scaleW}%`;
    element.style.height = `${scaleH}%`;
    element.style.transform = `translate(-50%, -50%)`;
  }

  convertRadioScale(label, radio, styleCommon, styleBtn, styleRadio) {
    let scaleX = (((styleBtn.x || 0) + (styleBtn.width || 0) / 2) / 1232) * 100;
    let scaleY = (((styleBtn.y || 0) + (styleBtn.height || 0) / 2) / 625) * 100;

    scaleX += ((styleRadio?.x || 0) / 1232) * 50;
    scaleY += ((styleRadio?.y || 0) / 625) * 50;
    const scaleW = ((styleCommon?.width || 0) / 1232) * 100;
    const scaleH = ((styleCommon?.height || 0) / 625) * 100;

    label.style.position = "absolute";
    label.style.top = `${scaleY}%`;
    label.style.left = `${scaleX}%`;
    label.style.width = `${scaleW}%`;
    label.style.height = `${scaleH}%`;
    label.style.transform = `translate(-50%, -50%)`;
    radio.style.position = "absolute";
    radio.style.top = `${scaleY}%`;
    radio.style.left = `${scaleX}%`;
    radio.style.width = `${scaleW}%`;
    radio.style.height = `${scaleH}%`;
    radio.style.transform = `translate(-50%, -50%)`;
    radio.style.margin = "0";
    radio.style.padding = "0";
  }

  convertTypingScale(element, input, style) {
    const scaleX = ((style.x || 0) / 1232) * 100;
    const scaleY = ((style.y || 0) / 625) * 100;
    const scaleW = ((style.width || 0) / 1232) * 100;
    const scaleH = ((style.height || 0) / 625) * 100;

    element.style.position = "absolute";
    element.style.top = `${scaleY}%`;
    element.style.left = `${scaleX}%`;
    element.style.width = `${scaleW}%`;
    element.style.height = `${scaleH}%`;
    input.style.position = "absolute";
    input.style.top = `0`;
    input.style.left = `0`;
    input.style.width = `100%`;
    input.style.height = `100%`;
    input.style.margin = `0`;
    input.style.padding = `0`;
    input.style.opacity = 0;
  }
  /*DOM STYLE : Positioning-------------- END ----------------*/

  showModal(screenReader, message) {
    const modal = document.createElement("div");
    const modalContent = document.createElement("div");
    const modalTitle = document.createElement("h2");
    const modalMessage = document.createElement("div");
    const modalButton = document.createElement("button");
    const previousFocus = document.activeElement;
    const quizeScene = this.scene.get("Quize");
    const screenReaderElement = document.getElementById("screenReader");

    // 스크린 리더 돔 숨김처리
    const screenReaderChild = screenReader.querySelectorAll("*");
    screenReader.setAttribute("aria-hidden", "true");
    screenReaderChild.forEach((el) => {
      el.setAttribute("tabindex", -1);
      el.setAttribute("aria-hidden", "true");
    });
    quizeScene.input.enabled = false;

    // 모달 스타일
    modal.id = "modalCommon";
    modal.style.position = "fixed";
    modal.style.top = `50%`;
    modal.style.left = `50%`;
    const screenReaderWidth = parseFloat(
      screenReaderElement.style.width.replace("px", "")
    );
    const screenReaderHeight = parseFloat(
      screenReaderElement.style.height.replace("px", "")
    );
    const modalWidthPercent =
      ((screenReaderWidth * (792 / 1232)) / window.innerWidth) * 100;
    const modalHeightPercent =
      ((screenReaderHeight * (393 / 625)) / window.innerHeight) * 100;
    modal.style.width = `${modalWidthPercent}%`;
    modal.style.height = `${modalHeightPercent}%`;
    modal.style.transform = "translate(-50%, -50%)";
    modal.style.padding = "0";
    modal.style.zIndex = "1000";
    modal.setAttribute("role", "dialog");
    modal.setAttribute("aria-modal", "true");
    modal.setAttribute("tabindex", -1);

    // 모달 내용 스타일
    modalContent.style.display = "flex";
    modalContent.style.flexDirection = "column";
    modalContent.style.justifyContent = "center";
    modalContent.style.alignItems = "center";
    modalContent.style.width = "100%";
    modalContent.style.height = "100%";
    modalContent.setAttribute("tabindex", 0);
    // modalContent.setAttribute("role", "group");

    // // 타이틀 설정
    modalTitle.id = "modal-title";
    modalTitle.textContent = "알림";
    modalTitle.style.width = "80%";
    modalTitle.style.height = "10%";
    modalTitle.setAttribute("tabindex", -1);
    modalTitle.setAttribute("aria-hidden", "true");
    modalTitle.setAttribute("role", "text");

    // 메시지 설정
    modalMessage.id = "title-dialog";
    modalMessage.textContent = message;
    modalMessage.style.width = "80%";
    modalMessage.style.height = "10%";
    modalMessage.setAttribute("tabindex", 0);
    modalMessage.setAttribute("role", "text");

    // 버튼 설정
    modalButton.textContent = "확인";
    modalButton.style.position = "absolute";
    modalButton.style.top = `84%`;
    modalButton.style.left = `57.5%`;
    modalButton.style.width = `24%`;
    modalButton.style.height = `24%`;
    modalButton.style.padding = 0;
    modalButton.style.transform = "translate(-50%, -50%)";
    modalButton.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();

      if (quizeScene.btnClosePopup) {
        quizeScene.btnClosePopup.emit("pointerup");
      }
      document.body.removeChild(modal);
      screenReader.setAttribute("aria-hidden", "false");
      screenReaderChild.forEach((el) => {
        el.removeAttribute("aria-hidden");

        if (
          el.id === "questionTitle" ||
          el.id === "questionExample" ||
          el.id === "questionLetter" ||
          el.id === "questionImage" ||
          el.id === "cardImg" ||
          el.id?.includes("choiceImage") ||
          el.id?.includes("choiceTxt")
        ) {
          el.setAttribute("tabindex", "0");
        } else {
          el.removeAttribute("tabindex");
        }
      });

      if (previousFocus && typeof previousFocus.focus === "function") {
        previousFocus.focus();
      }

      quizeScene.input.enabled = true;
    });

    // 모달에 추가
    modalContent.appendChild(modalTitle);
    modalContent.appendChild(modalMessage);
    modalContent.appendChild(modalButton);
    modal.appendChild(modalContent);
    document.body.appendChild(modal);

    // 포커스 관리
    modalContent.focus();
  }

  showResult(screenReader, message) {
    const modal = document.createElement("div");
    const modalContent = document.createElement("div");
    const modalTitle = document.createElement("h2");
    const modalMessage = document.createElement("div");
    const modalButton = document.createElement("button");
    const previousFocus = document.activeElement;
    const quizeScene = this.scene.get("Quize");
    const screenReaderElement = document.getElementById("screenReader");

    // 스크린 리더 돔 숨김처리
    const screenReaderChild = screenReader.querySelectorAll("*");
    screenReader.setAttribute("aria-hidden", "true");
    screenReaderChild.forEach((el) => {
      el.setAttribute("tabindex", -1);
      el.setAttribute("aria-hidden", "true");
    });
    quizeScene.input.enabled = false;

    // 모달 스타일
    modal.id = "modalResult";
    modal.style.position = "fixed";
    modal.style.top = `50%`;
    modal.style.left = `50%`;
    const screenReaderWidth = parseFloat(
      screenReaderElement.style.width.replace("px", "")
    );
    const screenReaderHeight = parseFloat(
      screenReaderElement.style.height.replace("px", "")
    );
    const modalWidthPercent =
      ((screenReaderWidth * (792 / 1232)) / window.innerWidth) * 100;
    const modalHeightPercent =
      ((screenReaderHeight * (393 / 625)) / window.innerHeight) * 100;
    modal.style.width = `${modalWidthPercent}%`;
    modal.style.height = `${modalHeightPercent}%`;
    modal.style.transform = "translate(-50%, -50%)";
    modal.style.padding = "0";
    modal.style.zIndex = "1000";
    modal.setAttribute("role", "dialog");
    modal.setAttribute("aria-modal", "true");
    modal.setAttribute("tabindex", -1);

    // 모달 내용 스타일
    modalContent.style.display = "flex";
    modalContent.style.flexDirection = "column";
    modalContent.style.justifyContent = "center";
    modalContent.style.alignItems = "center";
    modalContent.style.width = "100%";
    modalContent.style.height = "100%";
    modalContent.setAttribute("tabindex", 0);

    // 타이틀 설정
    modalTitle.id = "modal-title";
    modalTitle.textContent = "정답확인";
    modalTitle.style.width = "80%";
    modalTitle.style.height = "10%";
    modalTitle.setAttribute("tabindex", -1);
    modalTitle.setAttribute("aria-hidden", "true");
    modalTitle.setAttribute("role", "text");

    // 메시지 설정
    modalMessage.id = "title-dialog";
    modalMessage.innerHTML = this.wrapEnglishWithSpan(`결과: ${message}`);
    modalMessage.style.width = "80%";
    modalMessage.style.height = "10%";
    modalMessage.setAttribute("tabindex", 0);
    modalMessage.setAttribute("role", "text");

    // 버튼 설정
    modalButton.textContent = "확인";
    modalButton.style.position = "absolute";
    modalButton.style.top = `84%`;
    modalButton.style.left = `57.5%`;
    modalButton.style.width = `24%`;
    modalButton.style.height = `24%`;
    modalButton.style.padding = 0;
    modalButton.style.transform = "translate(-50%, -50%)";
    modalButton.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();

      if (quizeScene.btnClosePopup) {
        quizeScene.btnClosePopup.emit("pointerup");
      }

      screenReader.setAttribute("aria-hidden", "false");
      screenReaderChild.forEach((el) => {
        el.removeAttribute("aria-hidden");

        if (
          el.id === "questionTitle" ||
          el.id === "questionExample" ||
          el.id === "questionLetter" ||
          el.id === "questionImage" ||
          el.id === "cardImg" ||
          el.id?.includes("choiceImage") ||
          el.id?.includes("choiceTxt")
        ) {
          el.setAttribute("tabindex", "0");
        } else {
          el.removeAttribute("tabindex");
        }
      });

      if (previousFocus && typeof previousFocus.focus === "function") {
        previousFocus.focus();
      }

      document.body.removeChild(modal);
      quizeScene.input.enabled = true;
    });

    // 모달에 추가
    modalContent.appendChild(modalTitle);
    modalContent.appendChild(modalMessage);
    modalContent.appendChild(modalButton);
    modal.appendChild(modalContent);
    document.body.appendChild(modal);

    // 포커스 관리
    modalContent.focus();
  }

  showModalHint(screenReader, message, template) {
    const modal = document.createElement("div");
    const modalContent = document.createElement("div");
    const modalTitle = document.createElement("h2");
    const modalMessage = document.createElement("div");
    const modalButton = document.createElement("button");
    const previousFocus = document.activeElement;
    const quizeScene = this.scene.get("Quize");
    const screenReaderElement = document.getElementById("screenReader");

    // 스크린 리더 돔 숨김처리
    const screenReaderChild = screenReader.querySelectorAll("*");
    screenReader.setAttribute("aria-hidden", "true");
    screenReaderChild.forEach((el) => {
      el.setAttribute("tabindex", -1);
      el.setAttribute("aria-hidden", "true");
    });
    quizeScene.input.enabled = false;

    // 모달 스타일
    modal.id = "modalHint";
    modal.style.position = "fixed";
    modal.style.top = `50%`;
    modal.style.left = `50%`;
    const screenReaderWidth = parseFloat(
      screenReaderElement.style.width.replace("px", "")
    );
    const screenReaderHeight = parseFloat(
      screenReaderElement.style.height.replace("px", "")
    );
    const modalWidthPercent =
      ((screenReaderWidth * (792 / 1232)) / window.innerWidth) * 100;
    const modalHeightPercent =
      ((screenReaderHeight * (393 / 625)) / window.innerHeight) * 100;
    modal.style.width = `${modalWidthPercent}%`;
    modal.style.height = `${modalHeightPercent}%`;
    modal.style.transform = "translate(-50%, -50%)";
    modal.style.padding = "0";
    modal.style.zIndex = "1000";
    modal.setAttribute("role", "dialog");
    modal.setAttribute("aria-modal", "true");
    modal.setAttribute("tabindex", -1);

    // 모달 내용 스타일
    modalContent.style.display = "flex";
    modalContent.style.flexDirection = "column";
    modalContent.style.justifyContent = "center";
    modalContent.style.alignItems = "center";
    modalContent.style.width = "100%";
    modalContent.style.height = "100%";
    modalContent.setAttribute("tabindex", 0);

    // 타이틀 설정
    modalTitle.id = "modal-title";
    modalTitle.textContent = "힌트알림";
    modalTitle.style.width = "80%";
    modalTitle.style.height = "10%";
    modalTitle.setAttribute("tabindex", -1);
    modalTitle.setAttribute("aria-hidden", "true");
    modalTitle.setAttribute("role", "text");

    // 메시지 설정
    modalMessage.id = "title-dialog";
    modalMessage.innerHTML = this.wrapEnglishWithSpan(`힌트: ${message}`);
    modalMessage.style.width = "80%";
    modalMessage.style.height = "10%";
    modalMessage.setAttribute("tabindex", 0);
    modalMessage.setAttribute("role", "text");

    // 버튼 설정
    modalButton.textContent = "확인";
    modalButton.style.position = "absolute";
    modalButton.style.top = `84%`;
    modalButton.style.left = `57.5%`;
    modalButton.style.width = `24%`;
    modalButton.style.height = `24%`;
    modalButton.style.padding = 0;
    modalButton.style.transform = "translate(-50%, -50%)";
    modalButton.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();

      if (quizeScene.hintOkBtn) {
        quizeScene.hintOkBtn.emit("pointerdown");
      }

      screenReader.setAttribute("aria-hidden", "false");
      screenReaderChild.forEach((el) => {
        el.removeAttribute("aria-hidden");

        if (
          el.id === "questionTitle" ||
          el.id === "questionExample" ||
          el.id === "questionLetter" ||
          el.id === "questionImage" ||
          el.id === "cardImg" ||
          el.id?.includes("choiceImage") ||
          el.id?.includes("choiceTxt")
        ) {
          el.setAttribute("tabindex", "0");
        } else {
          el.removeAttribute("tabindex");
        }
      });

      if (previousFocus && typeof previousFocus.focus === "function") {
        previousFocus.focus();
      }

      document.body.removeChild(modal);
      quizeScene.input.enabled = true;
    });

    // 모달에 추가
    modalContent.appendChild(modalTitle);
    modalContent.appendChild(modalMessage);
    modalContent.appendChild(modalButton);
    modal.appendChild(modalContent);
    document.body.appendChild(modal);

    // 포커스 관리
    modalContent.focus();
  }

  //  Typing 제시어 구분 함수
  splitAnswerBySpace(quize) {
    const txtSpace = quize.txtSpace;
    let answer = quize.answer;
    const txtSpaceParts = txtSpace.split(",");
    let splitAnswer = [];
    let lastIndex = 0;
    let tmp = answer;

    txtSpaceParts.forEach((text, index) => {
      if (text === "0" && index % 2 !== 0) {
        const nextTxt = txtSpaceParts[index + 1];
        const nextTxtIndex = tmp.indexOf(nextTxt, lastIndex);
        if (nextTxtIndex !== -1) {
          const part = tmp.slice(lastIndex, nextTxtIndex).trim();
          if (part) splitAnswer.push(part); // 빈 문자열이 아니면 추가
          splitAnswer.push(""); // "0" 대신 빈 문자열 추가
          lastIndex = nextTxtIndex;
        }
      } else if (index % 2 === 0) {
        const currentTxtIndex = tmp.indexOf(text, lastIndex);
        if (currentTxtIndex !== -1) {
          const part = tmp.slice(lastIndex, currentTxtIndex).trim();
          if (part) splitAnswer.push(part); // 빈 문자열이 아니면 추가
          splitAnswer.push(text); // 현재 텍스트 추가
          lastIndex = currentTxtIndex + text.length;
        }
      }
    });

    if (lastIndex < tmp.length) {
      const part = tmp.slice(lastIndex).trim();
      if (part) splitAnswer.push(part); // 남아있는 텍스트 추가
    }

    // 각 부분의 앞뒤 공백 제거 및 빈 문자열 필터링
    splitAnswer = splitAnswer.filter((part) => part !== "");

    return splitAnswer;
  }

  //  Convert for notranslate
  wrapEnglishWithSpan(input) {
    return input.replace(/([a-zA-Z]+)([^a-zA-Z]*)/g, function (match, p1, p2) {
      return '<span role="text" class="notranslate">' + p1 + "</span>" + p2;
    });
  }

  //  일반 Dom Creator
  createCommonDom(dom, id, innerHTML) {
    dom.id = id;
    dom.tabIndex = 0;
    dom.innerHTML = innerHTML;
    dom.style.pointerEvents = "none";
    dom.setAttribute("role", "text");
  }
}
