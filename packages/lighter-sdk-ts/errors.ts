export class ValidationError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'ValidationError';
        Object.setPrototypeOf(this, ValidationError.prototype);
    }
}

export class NonceError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'NonceError';
        Object.setPrototypeOf(this, NonceError.prototype);
    }
}

export class SignerError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'SignerError';
        Object.setPrototypeOf(this, SignerError.prototype);
    }
}