const config = {
  type: Phaser.CANVAS,
  width: 1232,
  height: 625,
  parent: "game-container",
  backgroundColor: "#ffffff",
  scene: [Preload, Bg, Character, Quize, Udl],
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  render: {
    antialias: true,
    pixelArt: false,
  },
  plugins: {
    scene: [{ key: "SpinePlugin", plugin: SpinePlugin, mapping: "spine" }],
  },
};

function handleScale() {
  const gameContainer = document.getElementById("game-container");
  const canvasList = gameContainer.getElementsByTagName("canvas");

  while (canvasList.length > 1) {
    canvasList[canvasList.length - 1].remove();
  }

  if (canvasList.length > 0) {
    const canvas = canvasList[0];
    const canvasStyles = window.getComputedStyle(canvas);
    const canvasWidth = parseFloat(canvasStyles.width);
    const canvasHeight = parseFloat(canvasStyles.height);
    const canvasLeft = parseFloat(canvasStyles.marginLeft);
    const canvasTop = parseFloat(canvasStyles.marginTop);
    const canvasBot = parseFloat(canvasStyles.marginBottom);
    const canvasRight = parseFloat(canvasStyles.marginRight);

    const wrapElement = document.getElementById("wrap");
    const screenReaderElement = document.getElementById("screenReader");
    const questionElement = document.getElementById("question");

    if (wrapElement) {
      wrapElement.style.width = `${canvasWidth}px`;
      wrapElement.style.height = `${canvasHeight}px`;
      wrapElement.style.marginLeft = `${canvasLeft}px`;
      wrapElement.style.marginTop = `${canvasTop}px`;
      wrapElement.style.marginBottom = `${canvasBot}px`;
      wrapElement.style.marginRight = `${canvasRight}px`;
    }

    if (screenReaderElement) {
      screenReaderElement.style.width = `${canvasWidth}px`;
      screenReaderElement.style.height = `${canvasHeight}px`;
      screenReaderElement.style.marginLeft = `${canvasLeft}px`;
      screenReaderElement.style.marginTop = `${canvasTop}px`;
      screenReaderElement.style.marginBottom = `${canvasBot}px`;
      screenReaderElement.style.marginRight = `${canvasRight}px`;
    }

    if (questionElement) {
      const styleTitle = {
        width: 832,
        height: 70,
        radius: 25,
        font: { size: 24, weight: "700" },
      };
      const scale = canvasWidth / 1232;
      const paddingTop = 35;
      const sidePadding = 30 * scale;
      const questionTop = paddingTop * (canvasHeight / 625);

      questionElement.style.display = "flex";
      questionElement.style.alignItems = "center";
      questionElement.style.width = `${
        styleTitle.width * scale - sidePadding * 2
      }px`;
      questionElement.style.height = `${styleTitle.height * scale}px`;
      questionElement.style.paddingLeft = `${sidePadding}px`;
      questionElement.style.paddingRight = `${sidePadding}px`;
      questionElement.style.top = `${questionTop}px`;
      questionElement.style.left = `${
        (canvasWidth - styleTitle.width * scale) / 2
      }px`;
      questionElement.style.fontSize = `${styleTitle.font.size * scale}px`;
      questionElement.style.fontFamily = `"NanumGothicBold", sans-serif`;
      questionElement.style.fontWeight = styleTitle.font.weight;

      const underLineTxt = ["않은", "않는", "않으면", "다른"];
      let textContent = questionElement.innerHTML;

      underLineTxt.forEach((word) => {
        const regex = new RegExp(`(${word})`, "g");
        textContent = textContent.replace(
          regex,
          `<span class="underline">$1</span>`
        );
      });

      if (!document.getElementById("qTxt")) {
        const wrappedContent = `<div id="qTxt" class="text-wrapper">${textContent}</div>`;
        questionElement.innerHTML = wrappedContent;
      }
    }
  }
}

function handleAllScales() {
  requestAnimationFrame(handleScale);
}

window.addEventListener("resize", handleAllScales);
window.addEventListener("orientationchange", handleAllScales);
window.addEventListener("DOMContentLoaded", handleAllScales);
window.addEventListener("visibilitychange", handleAllScales);

window.addEventListener("load", () => {
  Promise.all([
    document.fonts.load('30px "Lexend"'),
    document.fonts.load('30px "NanumGothicBold"'),
  ])
    .then(() => {
      console.log("Fonts loaded");
      new Phaser.Game(config);
      handleAllScales();
    })
    .catch((err) => {
      console.error("Font loading failed:", err);
      new Phaser.Game(config);
      handleAllScales();
    });
});
