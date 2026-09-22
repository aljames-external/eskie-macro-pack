export let socketlibInstance: any = null;

export function setSocketlibInstance(instance: any) {
    socketlibInstance = instance;
}

export const socketlib = new Proxy({} as any, {
    get(_target, prop) {
        if (socketlibInstance) {
            const val = socketlibInstance[prop];
            return typeof val === 'function' ? val.bind(socketlibInstance) : val;
        }
        const ambient = (globalThis as any).socketlib;
        if (ambient) {
            const val = ambient[prop];
            return typeof val === 'function' ? val.bind(ambient) : val;
        }
        return undefined;
    }
});
