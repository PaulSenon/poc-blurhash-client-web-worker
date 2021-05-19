const EVENT = {
    ENTERING: 'entering',
    ENTERED: 'entered',
    LEAVING: 'leaving',
    LEFT: 'left',
    VISIBLE: 'visible',
};
const isEventValid = (event) => Object.values(EVENT).includes(event);

function isSupported() {
    return !!window.IntersectionObserver;
}

class InView {
    constructor({
        rootElement = undefined,
        rootMarginTop = 0,
        rootMarginBottom = 0,
        rootMarginRight = 0,
        rootMarginLeft = 0,
    } = {}) {
        // build props
        this.rootElement = rootElement;
        this.events = Object.values(EVENT);
        this.rootMargin = `${rootMarginTop}px ${rootMarginRight}px ${rootMarginBottom}px ${rootMarginLeft}px`;

        // contient toutes les données des éléments observés selon le model suivant :
        /**
            [
                {
                    element: (dom element),
                    isEntered: false,
                    isVisible: false,
                    callbacks: {
                        [EVENT.entering]: (function(entry)),
                        [EVENT.entered]: (function(entry)),
                        ...
                    },
                },
                ...
            ]
        */
        this.states = [];


        // une unique instance d'IntersectionObserver qui fait tout
        this.intersectionObserver = new IntersectionObserver(entries => entries.map(entry => {
            const {
                target,
                intersectionRatio,
                isIntersecting,
            } = entry;

            const state = this._getState(target);
            if(!state) return;

            // ENTERED
            if(intersectionRatio === 1){
                state.isEntered = true;
                const cb1 = this._getStateCallback(target, EVENT.ENTERED);
                if(cb1) cb1(entry);

                const cb2 = this._getStateCallback(target, EVENT.VISIBLE);
                if(!state.isVisible){
                    state.isVisible = true;
                    if(cb2) cb2(entry);
                }

                return;
            }

            // LEFT
            if(intersectionRatio === 0){
                state.isEntered = false;
                state.isVisible = false;

                const cb1 = this._getStateCallback(target, EVENT.LEFT);
                if(cb1) cb1(entry);

                return;
            }

            // TRANSITION STATES
            if (isIntersecting) {
                // LEAVING
                if(state.isEntered){
                    const cb1 = this._getStateCallback(target, EVENT.LEAVING);
                    if(cb1) cb1(entry);

                    const cb2 = this._getStateCallback(target, EVENT.VISIBLE);
                    if(!state.isVisible){
                        state.isVisible = true;
                        if(cb2) cb2(entry);
                    }

                    return;
                }
                // ENTERING
                else{
                    const cb1 = this._getStateCallback(target, EVENT.ENTERING);
                    if(cb1) cb1(entry);

                    const cb2 = this._getStateCallback(target, EVENT.VISIBLE);
                    if(!state.isVisible){
                        state.isVisible = true;
                        if(cb2) cb2(entry);
                    }

                    return;
                }
            }

        }), {
            root: rootElement,
            rootMargin: this.rootMargin,
            threshold: [0, 0.5, 1], // important, to detect both entering and leaving
        })
    }

    ////////////////////////////
    // this.states manipulators:

    _getState(element) {
        return this.states.find(s => s.element === element);
    }
    _getStateCallback(element, event) {
        // check
        if(!isEventValid(event)){
            throw Error(`InView Error: invalid event: \`event\` must be one of ["${Object.values(EVENT).join('", "')}"].`);
        }

        let state = this._getState(element);
        if(state && state.callbacks && state.callbacks[event]) return state.callbacks[event];
    }
    _addState(element) {
        if(this._getState(element)) return;

        this.states.push({
            element, 
            isEntered: false,
            isVisible: false,
            callbacks: {},
        });
    }
    _addStateCallback(element, event, callback) {
        // check
        if(!isEventValid(event)){
            throw Error(`InView Error: invalid event: \`event\` must be one of ["${Object.values(EVENT).join('", "')}"].`);
        }
        
        // ensure state exists
        if(!this._getState(element)) this._addState(element);

        const state = this._getState(element);
        state.callbacks[event] = callback;
    }
    _removeState(element) {
        this.states = this.states.filter(s => s.element !== element);
    }
    _removeStateCallback(element, event) {
        // check
        if(!isEventValid(event)){
            throw Error(`InView Error: invalid event: \`event\` must be one of ["${Object.values(EVENT).join('" ,"')}"].`);
        }

        let state = this._getState(element);
        if(state){
            delete state.callbacks[event];
        }
    }

    //////////////////////
    // register callbacks:

    /** ensure it's always an array of elements */
    _toArray(elementOrElements){
        if(elementOrElements instanceof NodeList) return [...elementOrElements];
        if(elementOrElements instanceof HTMLCollection) return [...elementOrElements];
        if(Array.isArray(elementOrElements)) return elementOrElements;
        return [elementOrElements];
    }

    onEntered(elementOrElements, callback){
        this.on(EVENT.ENTERED, elementOrElements, callback);
    }
    onEntering(elementOrElements, callback){
        this.on(EVENT.ENTERING, elementOrElements, callback);
    }
    onLeaving(elementOrElements, callback){
        this.on(EVENT.LEAVING, elementOrElements, callback);
    }
    onLeft(elementOrElements, callback){
        this.on(EVENT.LEFT, elementOrElements, callback);
    }
    // work as entered + entering + leaving
    onVisible(elementOrElements, callback){
        this.on(EVENT.VISIBLE, elementOrElements, callback);
    }
    // work alias of left 
    onNotVisible(elementOrElements, callback){
        this.on(EVENT.LEFT, elementOrElements, callback);
    }

    onceEntered(elementOrElements, callback){
        this.once(EVENT.ENTERED, elementOrElements, callback);
    }
    onceEntering(elementOrElements, callback){
        this.once(EVENT.ENTERING, elementOrElements, callback);
    }
    onceLeaving(elementOrElements, callback){
        this.once(EVENT.LEAVING, elementOrElements, callback);
    }
    onceLeft(elementOrElements, callback){
        this.once(EVENT.LEFT, elementOrElements, callback);
    }
    // work as entered + entering + leaving
    onceVisible(elementOrElements, callback){
        this.once(EVENT.VISIBLE, elementOrElements, callback);
    }
    // work alias of left 
    onceNotVisible(elementOrElements, callback){
        this.once(EVENT.LEFT, elementOrElements, callback);
    }

    on(event, elementOrElements, callback){
        elementOrElements = this._toArray(elementOrElements);
        for(let element of elementOrElements){
            // need do be done before so we know if we added the very first callback
            const doObserve = !this._getState(element);

            this._addStateCallback(element, event, callback);

            // if it's the first one we add it to observer
            if(doObserve){
                this.intersectionObserver.observe(element);
            }
        }
    }

    once(event, elementOrElements, callback){
        elementOrElements = this._toArray(elementOrElements);
        for(let element of elementOrElements){
            // need do be done before so we know if we added the very first callback
            const doObserve = !this._getState(element);

            this._addStateCallback(element, event, (entry) => {
                callback(entry);
                this.unobserveEvent(element, event);
            });

            // if it's the first one we add it to observer
            if(doObserve){
                this.intersectionObserver.observe(element);
            }
        }
    }

    ///////////////
    // unsubscribe:

    unobserve(elementOrElements){
        elementOrElements = this._toArray(elementOrElements);
        for(let element of elementOrElements){
            this.intersectionObserver.unobserve(element);
            this._removeState(element);
        }
    }

    unobserveEvent(elementOrElements, event){
        elementOrElements = this._toArray(elementOrElements);
        for(let element of elementOrElements){
            // if it's the only remaining callback, do full unobserve instead
            if (this._getStateCallback(element, event) && Object.keys(this._getState(element).callbacks).length === 1) {
                this.unobserve(element);
            } else {
                this._removeStateCallback(element, event);
            }
        }
    }

    unobserveAll(){
        for(const state of this.states){
            this.unobserve(state.element);
        }
    }
}

module.exports = InView;
module.exports.isSupported = isSupported;