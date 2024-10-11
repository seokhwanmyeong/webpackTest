class Character extends Phaser.Scene {
  constructor() {
    super({
      key: "Character",
    });
  }

  preload() {
    console.log("Character preload start");
    this.load.path = "images/chr/";
    this.load.spine("character", "Chr.json", ["Chr.atlas"], false);
    console.log("Character preload end");
  }

  create() {
    const template = this.game.template;
    const animsCharacter = template.anims.character;
    const styleCharacter = template.style.character;
    //  Character create
    console.log("Character create start");
    const character = this.add.spine(
      140 + styleCharacter.x,
      template.style.bg.mainY + styleCharacter.y,
      "character",
      animsCharacter.init,
      true
    );

    character.setScale(styleCharacter.scale);
    this.character = character;
    this.events.on("changeAnimation", this.changeAnimation);
    console.log("Character create end");
    // this.scene.bringToTop();
  }

  creatAnim(key, sceneNum) {
    let ani = [];
    for (let i = 0; i <= sceneNum; i++) {
      ani.push(`${key}${i}`);
    }
    return ani;
  }

  changeAnimation(key, next) {
    this.character?.play(key, false).on("complete", () => {
      if (next) this.character.play(next, false);
    });
  }

  resetAnimation() {
    const animsCharacter = this.game.template.anims.character;
    this.character?.play(animsCharacter.init, false);
  }

  setVisibleCharacter(active) {
    this.character?.setVisible(active);
  }
}
