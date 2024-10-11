class Preload extends Phaser.Scene {
  constructor() {
    super({ key: "Preload" });
  }

  preload() {
    console.log("preload start");
    this.load.path = "./";
    this.load.json("common", "content/common.json");
    this.load.json("template", "content/template.json");
    this.load.json("quize", "content/quize.json");
    this.load.json("animation", "content/animation.json");
    console.log("preload end");
  }

  create() {
    console.log("preload complete & game start");
    const common = this.cache.json.get("common");
    const template = this.cache.json.get("template");
    const quize = this.cache.json.get("quize");
    const animation = this.cache.json.get("animation");

    const json = {
      ...quize,
      ...common,
      ...template,
      style: {
        ...common.style,
        ...template.style,
      },
    };

    json.src.audio = template.src.audio
      ? { ...common.src.audio, ...template.src.audio }
      : common.src.audio;

    if (template.src.image)
      json.src.image = {
        ...common.src.image,
        ...template.src.image,
        btn: template.src.image.btn
          ? [...common.src.image.btn, ...template.src.image.btn]
          : common.src.image.btn,
      };

    if (template.src.anims)
      json.src.anims = { ...common.src.anims, ...template.src.anims };

    if (animation?.style) json.style = { ...json.style, ...animation.style };
    if (animation?.anims) json.anims = { ...json.anims, ...animation.anims };

    this.game.template = json;
    this.scene.run("Bg");
    this.scene.run("Character");
    this.scene.run("Quize");
    this.scene.run("Udl");
  }
}
