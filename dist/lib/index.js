"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LoggedParam = exports.InjectLogger = exports.ScopedLogger = exports.LoggedFunction = exports.LoggedRoute = void 0;
var logged_1 = require("./logged");
Object.defineProperty(exports, "LoggedRoute", { enumerable: true, get: function () { return logged_1.LoggedRoute; } });
Object.defineProperty(exports, "LoggedFunction", { enumerable: true, get: function () { return logged_1.LoggedFunction; } });
var logger_1 = require("./logger");
Object.defineProperty(exports, "ScopedLogger", { enumerable: true, get: function () { return logger_1.ScopedLogger; } });
var reflected_1 = require("./reflected");
Object.defineProperty(exports, "InjectLogger", { enumerable: true, get: function () { return reflected_1.InjectLogger; } });
Object.defineProperty(exports, "LoggedParam", { enumerable: true, get: function () { return reflected_1.LoggedParam; } });
//# sourceMappingURL=index.js.map