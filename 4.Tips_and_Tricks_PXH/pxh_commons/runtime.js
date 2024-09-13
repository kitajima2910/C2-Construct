// ECMAScript 5 strict mode
"use strict";

assert2(cr, "cr namespace not created");
assert2(cr.plugins_, "cr.plugins_ not created");

/////////////////////////////////////
// Plugin class
cr.plugins_.PXH_COMMONS = function (runtime) {
    this.runtime = runtime;
};

(function () {
    var pluginProto = cr.plugins_.PXH_COMMONS.prototype;

    /////////////////////////////////////
    // Type class
    pluginProto.Type = function (plugin) {
        this.plugin = plugin;
        this.runtime = plugin.runtime;
    };

    var typeProto = pluginProto.Type.prototype;

    typeProto.onCreate = function () {
    };

    /////////////////////////////////////
    // Instance class
    pluginProto.Instance = function (type) {
        this.type = type;
        this.runtime = type.runtime;
        // this.gamepadCount = 100;  // Biến lưu số lượng gamepad
    };

    var instanceProto = pluginProto.Instance.prototype;

    instanceProto.onCreate = function () {
        this.gamepads = [];
        this.previousButtonStates = [];
        this.lastLeftStickXValues = [];
        this.lastLeftStickYValues = [];
        this.runtime.tickMe(this);
    };

    instanceProto.onDestroy = function () {
    };

    instanceProto.tick = function () {
        // var ev = this.runtime.all_global_vars;

        // for (var i = 0; i < ev.length; i++) {
        //     if (ev[i].name === "GamepadCount") {
        //         console.log("GamepadCount: " + ev[i].getValue());
        //         ev[i].setValue(10000000);
        //     }
        // }

        // Start: support gamepads
        this.updateGamepads();
        // End: support gamepads
    };

    // Start: support gamepads
    instanceProto.updateGamepads = function () {
        var gamepads = navigator.getGamepads ? navigator.getGamepads() : (navigator.webkitGetGamepads ? navigator.webkitGetGamepads() : []);

        for (var i = 0; i < gamepads.length; i++) {
            if (gamepads[i] && !this.gamepads[i]) {
                // Gamepad mới được kết nối
                this.gamepads[i] = this.createGamepadState(gamepads[i]);
                this.previousButtonStates[i] = new Array(this.gamepads[i].buttons.length).fill(false);
                this.lastLeftStickXValues[i] = 0;
                this.lastLeftStickYValues[i] = 0;
                this.runtime.trigger(cr.plugins_.PXH_COMMONS.prototype.cnds.OnGamepadConnected, this);
            } else if (!gamepads[i] && this.gamepads[i]) {
                // Gamepad bị ngắt kết nối
                this.gamepads[i] = null;
                this.previousButtonStates[i] = null;
                this.lastLeftStickXValues[i] = null;
                this.runtime.trigger(cr.plugins_.PXH_COMMONS.prototype.cnds.OnGamepadDisconnected, this);
            }

            if (gamepads[i] && this.gamepads[i]) {
                // Cập nhật trạng thái gamepad
                this.updateGamepadState(this.gamepads[i], gamepads[i]);

                // Kiểm tra các nút
                for (var j = 0; j < this.gamepads[i].buttons.length; j++) {
                    if (this.gamepads[i].buttons[j].pressed && !this.previousButtonStates[i][j]) {
                        this.runtime.trigger(cr.plugins_.PXH_COMMONS.prototype.cnds.OnButtonPressed, this);
                    }

                    this.previousButtonStates[i][j] = this.gamepads[i].buttons[j].pressed;
                }

                // Left Stick (axes 0 và 1)
                var leftStickX = this.gamepads[i].axes[0]; // Trục ngang của Left Stick
                var leftStickY = this.gamepads[i].axes[1]; // Trục dọc của Left Stick

                // Right Stick (axes 2 và 3)
                var rightStickX = this.gamepads[i].axes[2]; // Trục ngang của Right Stick
                var rightStickY = this.gamepads[i].axes[3]; // Trục dọc của Right Stick

                // Ví dụ kiểm tra xem có đang di chuyển Left Stick hay không
                if (Math.abs(leftStickX) > 0.5 || Math.abs(leftStickY) > 0.5) {
                    this.checkLeftStickXY = { x: leftStickX, y: leftStickY };
                    this.runtime.trigger(cr.plugins_.PXH_COMMONS.prototype.cnds.OnLeftStickMoved, this);
                }

                // Ví dụ kiểm tra xem có đang di chuyển Right Stick hay không
                if (Math.abs(rightStickX) > 0.5 || Math.abs(rightStickY) > 0.5) {
                    this.checkRightStickXY = { x: rightStickX, y: rightStickY };
                    this.runtime.trigger(cr.plugins_.PXH_COMMONS.prototype.cnds.OnRightStickMoved, this);
                }

                // Kiểm tra chuyển động của trục X của Left Stick
                if (this.hasSignificantChange(leftStickX, this.lastLeftStickXValues[i])) {
                    this.lastLeftStickXValues[i] = leftStickX;
                    this.runtime.trigger(cr.plugins_.PXH_COMMONS.prototype.cnds.OnLeftStickXMoved, this);
                }

                // Kiểm tra chuyển động của trục Y của Left Stick
                if (this.hasSignificantChange(leftStickY, this.lastLeftStickYValues[i])) {
                    this.lastLeftStickYValues[i] = leftStickY;
                    this.runtime.trigger(cr.plugins_.PXH_COMMONS.prototype.cnds.OnLeftStickYMoved, this);
                }
            }
        }
    };

    // Hàm kiểm tra xem có sự thay đổi đáng kể trong giá trị X, Y
    instanceProto.hasSignificantChange = function (newX, previousX) {
        var threshold = 0.5; // Ngưỡng để xác định sự thay đổi đáng kể
        return Math.abs(newX - previousX) > threshold;
    };
    
    instanceProto.createGamepadState = function (gamepad) {
        return {
            index: gamepad.index,
            id: gamepad.id,
            buttons: Array.from(gamepad.buttons, b => ({ pressed: b.pressed, value: b.value })),
            axes: Array.from(gamepad.axes)
        };
    };

    instanceProto.updateGamepadState = function (storedGamepad, currentGamepad) {
        storedGamepad.buttons = Array.from(currentGamepad.buttons, b => ({ pressed: b.pressed, value: b.value }));
        storedGamepad.axes = Array.from(currentGamepad.axes);
    };
    // End: support gamepads

    //////////////////////////////////////
    // Conditions
    function Cnds() { };

    // Start: support gamepads
    Cnds.prototype.OnGamepadConnected = function () {
        return true;
    };

    Cnds.prototype.OnGamepadDisconnected = function () {
        return true;
    };

    Cnds.prototype.OnButtonPressed = function (buttonIndex, gamepadIndex) {
        var buttonPressed = false;

        var startIndex = (gamepadIndex === 0) ? 0 : gamepadIndex - 1;
        var endIndex = (gamepadIndex === 0) ? this.gamepads.length : gamepadIndex;

        for (var i = startIndex; i < endIndex; i++) {
            if (this.gamepads[i]) {
                var startButton = (buttonIndex === 0) ? 0 : buttonIndex - 1;
                var endButton = (buttonIndex === 0) ? this.gamepads[i].buttons.length : buttonIndex;

                for (var j = startButton; j < endButton; j++) {
                    if (this.gamepads[i].buttons[j] && this.gamepads[i].buttons[j].pressed) {
                        // Log để debug
                        // console.log("Button pressed:", j, "on gamepad", i);

                        // Xử lý D-Pad (thường là các nút từ 12-15)
                        if (j >= 12 && j <= 15) {
                            var dpadDirection;
                            switch (j) {
                                case 12: dpadDirection = "Up"; break;
                                case 13: dpadDirection = "Down"; break;
                                case 14: dpadDirection = "Left"; break;
                                case 15: dpadDirection = "Right"; break;
                            }
                            // console.log("D-Pad pressed:", dpadDirection);
                        }

                        buttonPressed = true;
                        break;
                    }
                }
                if (buttonPressed) break;
            }
        }

        return buttonPressed;
    };

    Cnds.prototype.OnLeftStickMoved = function (gamepadIndex) {
        if (this.gamepads[gamepadIndex]) {
            return Math.abs(this.gamepads[gamepadIndex].axes[0]) > 0.5 || Math.abs(this.gamepads[gamepadIndex].axes[1]) > 0.5;
        }
        return false;
    }

    Cnds.prototype.OnRightStickMoved = function (gamepadIndex) {
        if (this.gamepads[gamepadIndex]) {
            return Math.abs(this.gamepads[gamepadIndex].axes[2]) > 0.5 || Math.abs(this.gamepads[gamepadIndex].axes[3]) > 0.5;
        }
        return false;
    }

    Cnds.prototype.OnLeftStickXMoved = function (gamepadIndex, comparison, X) {

        if (this.gamepads[gamepadIndex]) {
            var currentX = this.gamepads[gamepadIndex].axes[0];
            switch (comparison) {
                case 0: // Less than
                    return currentX < -Math.abs(X);
                case 1: // Greater than
                    return currentX > Math.abs(X);
            }
        }
        return false;
    };


    Cnds.prototype.OnLeftStickYMoved = function (gamepadIndex, comparison, Y) {

        if (this.gamepads[gamepadIndex]) {
            var currentY = this.gamepads[gamepadIndex].axes[1];
            switch (comparison) {
                case 0: // Less than (moving up)
                    return currentY < -Math.abs(Y);
                case 1: // Greater than (moving down)
                    return currentY > Math.abs(Y);
            }
        }
        return false;
    };
    // End: support gamepads

    pluginProto.cnds = new Cnds();

    //////////////////////////////////////
    // Actions
    function Acts() { };



    pluginProto.acts = new Acts();

    //////////////////////////////////////
    // Expressions
    function Exps() { };

    // Start: support gamepads
    Exps.prototype.GamepadCount = function (ret) {
        var count = 0;
        for (var i = 0; i < this.gamepads.length; i++) {
            if (this.gamepads[i]) count++;
        }
        ret.set_int(count);
    };

    Exps.prototype.GamepadLeftStickX = function (ret) {
        ret.set_float(this.checkLeftStickXY.x);
    }

    Exps.prototype.GamepadLeftStickY = function (ret) {
        ret.set_float(this.checkLeftStickXY.y);
    }

    Exps.prototype.GamepadRightStickX = function (ret) {
        ret.set_float(this.checkRightStickXY.x);
    }

    Exps.prototype.GamepadRightStickY = function (ret) {
        ret.set_float(this.checkRightStickXY.y);
    }
    // End: support gamepads

    pluginProto.exps = new Exps();

}());