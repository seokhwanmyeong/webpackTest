class Bg extends Phaser.Scene {
  constructor() {
    super({
      key: "Bg",
    });
    this.bg = false;
    this.decor = false;
    this.obj = false;
  }

  preload() {
    console.log("Background preload start");
    this.template = this.game.template;
    const bg = this.template.src.image.bg;
    const deco = this.template.src.image.deco;
    const animsObj = this.template.anims?.object;

    if (bg) {
      this.bg = true;
      this.load.image(bg.key, `${bg.root}${bg.name}.${bg.fileExtends}`);
    }
    if (deco) {
      this.deco = true;
      deco.map((unit) => {
        this.load.image(
          unit.key,
          `${unit.root}${unit.name}.${unit.fileExtends}`
        );
      });
    }
    this.load.path = "images/obj/";
    console.log("Object preload Start");
    // //  object preload
    if (animsObj) {
      this.obj = true;
      animsObj.map((obj, i) => {
        this.load.spine(`obj${i + 1}`, obj.json, [obj.atlas], false);
      });
    }
    console.log("Object preload End");
    console.log("Background preload end");
  }

  create() {
    const style = this.template.style;
    const animsObj = this.template.anims?.object;

    if (this.bg) {
      this.add
        .image(0, 0, "bg")
        .setOrigin(0, 0)
        .setDisplaySize(style?.bg?.mainX, style?.bg?.mainY);
    }
    if (this.deco) {
      this.add
        .image(style?.deco?.x, style?.deco?.y, "deco")
        .setOrigin(1, 1)
        .setDisplaySize(style?.deco?.width, style?.deco?.heigth)
        .setDepth(2);
    }

    //  Object create
    if (this.obj && animsObj) {
      console.log("Object create start");
      animsObj.map((obj, i) => {
        const spineObj = this.add.spine(
          obj.x,
          obj.y,
          `obj${i + 1}`,
          obj.init,
          true
        );

        if (obj?.width && obj?.height) {
          spineObj.width = obj?.width;
          spineObj.height = obj?.height;
          spineObj.x = spineObj.x + spineObj.width / 2;
          spineObj.y = spineObj.y + spineObj.height / 2 - 95 / 2;
        }
      });
      console.log("Object create end");
    }
  }

  creatAnim(key, sceneNum) {
    let ani = [];
    for (let i = 0; i <= sceneNum; i++) {
      ani.push(`${key}${i}`);
    }
    return ani;
  }
}
