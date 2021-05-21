const {inspect} = require('util');
const {EOL} = require('os');

export const setupCustomInspect = (obj: any) => {
    // istanbul ignore else
    if (typeof module !== 'undefined') {
        let inspecting = false;
        Object.defineProperty(obj.prototype, inspect.custom, {
            value() {
                if (inspecting) {
                    return this;
                }
                inspecting = true;
                const options = {colors: process.stdout.isTTY};
                const src = inspect(this, options);
                const {host, hostname, port, type} = this;
                const vp = inspect({host, hostname, port, type}, options);
                inspecting = false;
                return `${src}${EOL}Virtual Properties: ${vp}`;
            }
        });
    }
};
