// You can write more code here

/* START OF COMPILED CODE */

/* START-USER-IMPORTS */
/* END-USER-IMPORTS */
import { SOCKET } from "@/lib/socket";
import { Socket } from "socket.io-client";

export default class Matchmaking extends Phaser.Scene {
    private socket: Socket;

    private PLAYER_SPRITE: Phaser.GameObjects.Image;
    private BUTTON_CANCEL!: Phaser.GameObjects.Image;
    private LOADER!: Phaser.GameObjects.Text;
    private PLAYER_NAME!: Phaser.GameObjects.Text;
    private FINDING_MATCH_TEXT!: Phaser.GameObjects.Text;

    constructor() {
        super("Matchmaking");
    }

    editorCreate(): void {
        this.PLAYER_SPRITE = this.add.image(528, 608, "M_charONE");
        this.PLAYER_SPRITE.scaleX = 1.310153805177419;
        this.PLAYER_SPRITE.scaleY = 1.310153805177419;

        // image_3
        this.add.image(160, 176, "M_playerCard");

        // btnCancel
        this.BUTTON_CANCEL = this.add.image(1424, 704, "M_btnCancel");
        this.BUTTON_CANCEL.scaleX = 1.419003049417908;
        this.BUTTON_CANCEL.scaleY = 1.419003049417908;

        // text_1
        this.FINDING_MATCH_TEXT = this.add.text(1168, 416, "", {});
        this.FINDING_MATCH_TEXT.scaleX = 1.4657553250177893;
        this.FINDING_MATCH_TEXT.scaleY = 1.4657553250177893;
        this.FINDING_MATCH_TEXT.text = "Finding a Match";
        this.FINDING_MATCH_TEXT.setStyle({
            fontFamily: "Arial",
            fontSize: "48px",
            fontStyle: "bold",
        });

        // loader
        this.LOADER = this.add.text(1392, 496, "", {});
        this.LOADER.scaleX = 1.4657553250177893;
        this.LOADER.scaleY = 1.4657553250177893;
        this.LOADER.text = "...";
        this.LOADER.setStyle({
            fontFamily: "Arial",
            fontSize: "48px",
            fontStyle: "bold",
        });

        this.PLAYER_NAME = this.add.text(32, 144, "", {});
        this.PLAYER_NAME.text = "Player Name";
        this.PLAYER_NAME.setStyle({
            align: "center",
            fontFamily: "Arial",
            fontSize: "64px",
            fontStyle: "bold",
        });

        this.PLAYER_SPRITE = this.PLAYER_SPRITE;

        this.events.emit("scene-awake");
    }

    /* START-USER-CODE */

    // Write your code here

    create() {
        // Add the main background image first (behind all other elements)
        // Make it responsive to cover the full screen
        const bg = this.add.image(0, 0, "2G_bg");
        bg.setOrigin(0, 0);
        bg.setDisplaySize(this.cameras.main.width, this.cameras.main.height);
        bg.setDepth(-1000); // Ensure background is behind everything

        this.socket = SOCKET;
        this.socket.connect();

        this.editorCreate();

        this.animateEntrance();

        this.setupEntranceTransition();

        this.BUTTON_CANCEL.setInteractive();
        this.BUTTON_CANCEL.on("pointerdown", () => {
            this.cameras.main.fadeOut(180, 0, 0, 0);

            this.cameras.main.once("camerafadeoutcomplete", () => {
                this.tweens.add({
                    targets: this.BUTTON_CANCEL,
                    scale: "*=0.9",
                    duration: 100,
                    yoyo: true,
                    onComplete: () => {
                        this.scene.stop("Matchmaking");
                        this.scene.start("Home");
                    },
                });
            });
        });

        this.BUTTON_CANCEL.on("pointerover", () => {
            this.BUTTON_CANCEL.setTint(0xffff66);
        });

        this.BUTTON_CANCEL.on("pointerout", () => {
            this.BUTTON_CANCEL.clearTint();
        });

        this.animateLoader();

        this.socket.emit("findMatch");

        this.socket.on("matchFound", (data) => {
            this.cameras.main!.fadeOut(400, 0, 0, 0);
            this.cameras.main.once("camerafadeoutcomplete", () => {
                this.scene.stop("Matchmaking");
                this.scene.start("MatchFound");
            });
        });

        this.sound.play("waiting-music", { loop: true });
        this.events.on("shutdown", this.onShutdown, this);
    }

    setupEntranceTransition() {
        this.cameras.main.fadeIn(800, 0, 0, 0, (_: any, progress: any) => {
            const easedProgress = Math.pow(progress, 3);
            this.cameras.main.setAlpha(easedProgress);
        });
    }

    animateEntrance() {
        this.tweens.add({
            targets: this.PLAYER_SPRITE,
            angle: 360,
            duration: 1000,
            ease: "Sine.easeInOut",
            repeat: 0,
        });
    }

    private animateLoader() {
        let dots = [".", "..", "..."];
        let index = 0;

        this.time.addEvent({
            delay: 250, // Update every 200ms
            repeat: -1, // Repeat for the given duration in 200ms intervals
            callback: () => {
                this.LOADER.text = dots[index];
                index = (index + 1) % dots.length;
            },
        });
    }

    onShutdown() {
        this.sound.stopByKey("waiting-music");
    }

    /* END-USER-CODE */
}

/* END OF COMPILED CODE */

// You can write more code here

