# Frontend Development Tasks

| TASK | DESCRIPTION | FILES & FUNCTIONS | STATUS |
|------|-------------|-------------------|--------|
| **🎥 Smooth Camera Follow** | Ensure camera only follows client player with smooth tracking. Compatible with multiplayer. | **Files:** `packages/phaser-games/wildstrikes/src/scenes/arena/ArenaScene.ts`<br>**Functions:** `create()`, `update()`<br>**Steps:** 1. Find player instance with `this.player` or ID check 2. Set `this.cameras.main.startFollow(this.player, true)` 3. Add smooth parameters: `this.cameras.main.followOffset.set(-200, 0)` | ⏳ |
| **🎥 Map Parallax Effect** | Add layered parallax effect for immersive movement in addition to camera follow. | **Files:** `packages/phaser-games/wildstrikes/src/scenes/arena/ArenaScene.ts`<br>**Functions:** `create()`, `update()`<br>**Steps:** 1. Create multiple background layers with different depths 2. Apply movement at different speeds: `layer1.x -= playerSpeed * 0.1` 3. Use `setScrollFactor(0.X)` with decreasing values | ⏳ |
| **🎥 Dash Visual Feedback** | Player sprite turns white during dash, then reverts after completion. | **Files:** Player entity files in arena scene<br>**Functions:** `dash()`, `update()`<br>**Steps:** 1. Set tint to white: `this.sprite.setTint(0xffffff)` 2. Revert with timer: `this.scene.time.delayedCall(dashDuration, () => this.sprite.clearTint())` | ⏳ |
| **🕹️ Fix Dash Movement** | Player dashes forward (not based on rotation/camera). Adds invulnerability window for multiplayer. | **Files:** Player entity files<br>**Functions:** `dash()`, `handleInput()`<br>**Steps:** 1. Use facing direction: `this.body.velocity.x = this.facingRight ? dashSpeed : -dashSpeed` 2. Add invulnerability: `this.isInvulnerable = true` 3. Reset with timer | ⏳ |
| **🕹️ Smoother Jump** | Improve jump interpolation and responsiveness for better control. | **Files:** Player entity files<br>**Functions:** `jump()`, `update()`<br>**Steps:** 1. Adjust jump velocity: `this.body.velocity.y = -jumpForce` 2. Add variable jump height based on hold time 3. Implement coyote time | ⏳ |
| **🕹️ Enable Sprinting** | Allow sprinting when SHIFT held. Review interaction with other movements. | **Files:** Player entity files<br>**Functions:** `handleInput()`, `update()`<br>**Steps:** 1. Check SHIFT: `this.isSprinting = this.scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SHIFT).isDown` 2. Modify speed: `this.body.velocity.x = this.moveSpeed * (this.isSprinting ? 1.5 : 1)` 3. Adjust animation speed | ⏳ |
| **🕹️ Enable Rolling (E)** | Use rolling animation. Fire animation, move forward, flip direction (towards enemy in multiplayer). | **Files:** Player entity files<br>**Functions:** `handleInput()`, `roll()`, `update()`<br>**Steps:** 1. Add E key: `this.keyE = this.scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.E)` 2. Create roll function with animation and movement 3. Implement flipping: `this.sprite.flipX = !this.sprite.flipX` 4. Add cooldown | ⏳ |
| **🧎 Fix Crouch Looping** | Stop crouch animation looping. Should trigger once unless re-pressed. | **Files:** Player entity files<br>**Functions:** `handleInput()`, `crouch()`<br>**Steps:** 1. Track state: `this.isCrouching` 2. Only play on state change: `if (keyDown && !this.isCrouching) { this.sprite.play('crouch'); this.isCrouching = true }` 3. Reset on release | ⏳ |
| **🧎 Crouch Walking & Attacking** | Double-check animation transitions and movement. Crouch + movement and crouch + attack logic. | **Files:** Player entity files<br>**Functions:** `handleInput()`, `update()`, `attack()`<br>**Steps:** 1. Detect combined inputs: `this.isCrouchWalking = this.isCrouching && (this.keyA.isDown \|\| this.keyD.isDown)` 2. Play animation: `this.sprite.play('crouch-walk', true)` 3. Add crouch attack logic 4. Reduce speed: `this.body.velocity.x *= 0.5` | ⏳ |
| **🧟‍♂️ Hit & Death Animations** | Prepare functions for hit and death animations. Will be triggered by multiplayer logic. | **Files:** Player entity files<br>**Functions:** `takeDamage()`, `die()`<br>**Steps:** 1. Create functions for multiplayer calls 2. Hit animation: `takeDamage() { this.sprite.play('hit'); this.sprite.once('animationcomplete', () => this.sprite.play('idle')) }` 3. Death animation: `die() { this.sprite.play('death'); this.isAlive = false }` 4. Add state tracking | ⏳ |
| **📱 Mobile Controls** | Implement virtual joystick and action buttons for mobile support. | **Files:** `packages/phaser-games/wildstrikes/src/scenes/arena/ArenaScene.ts`, potentially `packages/phaser-games/wildstrikes/src/utils/MobileControls.ts`<br>**Functions:** `create()`, `setupMobileControls()`, `update()`<br>**Implementation:** Load rexvirtualjoystickplugin, create joystick in bottom left, add action buttons in bottom right, connect events to player actions | ⏳ |


## 📝 Mobile Controls Implementation Details

### Plugin Setup
```typescript
// In preload()
this.load.plugin('rexvirtualjoystickplugin', 'https://raw.githubusercontent.com/rexrainbow/phaser3-rex-notes/master/dist/rexvirtualjoystickplugin.min.js', true)
```

### Joystick Creation
```typescript
// In create()
this.joyStick = this.plugins.get('rexvirtualjoystickplugin').add(this, {
  x: 100, 
  y: game.config.height - 100,
  radius: 50,
  base: this.add.circle(0, 0, 50, 0x888888, 0.5),
  thumb: this.add.circle(0, 0, 25, 0xcccccc, 0.8)
})
```

### Input Handling
```typescript
// In update()
if(this.joyStick.force > 20) { 
  this.player.moveFromJoystick(this.joyStick.angle) 
}

// Button events
jumpButton.on('pointerdown', () => this.player.jump())
```

---

## 📋 Implementation Notes

- **Multiplayer Considerations**: All movement and combat mechanics should be designed with future multiplayer integration in mind
- **Animation Priority**: Ensure proper animation state management to prevent conflicts between different actions
- **Performance**: Consider optimization for mobile devices when implementing controls and visual effects
- **Testing**: Test all mechanics on both desktop and mobile devices to ensure consistent behavior

## 🔧 Key Files to Focus On

- `packages/phaser-games/wildstrikes/src/scenes/arena/` - Arena scene files
- Player entity/character files within the arena scene structure
- Input handling and control systems
- Animation management systems

---

## 📊 Status Legend
- ⏳ **Pending** - Not started
- 🚧 **In Progress** - Currently being worked on  
- ✅ **Complete** - Finished and tested
- ❌ **Blocked** - Waiting for dependencies
