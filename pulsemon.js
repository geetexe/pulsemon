import Emttr from 'emttr';

export const NETWORK_STATUS = Object.freeze({
    ONLINE: 'ONLINE',
    OFFLINE: 'OFFLINE',
    CHECKING: 'CHECKING'
});

export const EVENTS = Object.freeze({ NETWORK: 'network' });

class Pulsemon {

    _event;
    #intervalDuration;
    #url;
    #isOnline;
    #interval;
    #pollingInProcess = false;
    #defaultOptions = {interval: 5000, url: '/pulsemon/ping.json'};

    constructor(options){
        const mergedOptions = {...this.#defaultOptions, ...options};
        const {interval, url} = mergedOptions;
        this.#intervalDuration = interval;
        this.#url = url;
    }

    async #poll() {
        if(this.#pollingInProcess) return null;
        this.#pollingInProcess = true;
        let isNetworkOnline = false;
        try{
            isNetworkOnline = !!(await fetch(`${this.#url}?d=${new Date().getTime()}`, {method: 'HEAD'}));
        } catch(err){
            console.error(err);
        } finally{
            this.#pollingInProcess = false;
            return isNetworkOnline;
        }
    }

    init(){
        this._event = new Emttr();
        this.#poll().then(isOnline => {
            if(isOnline === null) return;
            this.#isOnline = isOnline;
            this._event.publish(EVENTS.NETWORK, {
                isOnline: this.#isOnline
            });
        });
        this.#interval = setInterval(async () => {
            const result = await this.#poll();
            if(result === null) return;
            this.#isOnline = result;
            this._event.publish(EVENTS.NETWORK, {
                isOnline: this.#isOnline
            });
        }, this.#intervalDuration);
        return this._event;
    }

    stop(){
        clearInterval(this.#interval);
        this._event.clear();
    }

    networkStatus(){
        if(this.#isOnline === undefined) return NETWORK_STATUS.CHECKING;
        return this.#isOnline ? NETWORK_STATUS.ONLINE : NETWORK_STATUS.OFFLINE;
    }
}

export default Pulsemon;