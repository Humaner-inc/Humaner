import { CredentialsSignin } from 'next-auth';

import { AuthErrorCode } from '@/lib/auth/errors';

// Common errors

export class ForbiddenError extends Error {
  constructor(message: string = 'Forbidden.') {
    super(message);
    this.name = 'ForbiddenError';
    Object.setPrototypeOf(this, ForbiddenError.prototype);
  }
}

export class ValidationError extends Error {
  constructor(message: string = 'Input contains invalid data.') {
    super(message);
    this.name = 'ValidationError';
    Object.setPrototypeOf(this, ValidationError.prototype);
  }
}

export class PreConditionError extends Error {
  constructor(message: string = 'Pre-condition failed.') {
    super(message);
    this.name = 'PreConditionError';
    Object.setPrototypeOf(this, PreConditionError.prototype);
  }
}

export class NotFoundError extends Error {
  constructor(message: string = 'Not Found.') {
    super(message);
    this.name = 'NotFoundError';
    Object.setPrototypeOf(this, NotFoundError.prototype);
  }
}

export class GatewayError extends Error {
  constructor(message: string = 'Gateway or service responsed with error.') {
    super(message);
    this.name = 'GatewayError';
    Object.setPrototypeOf(this, GatewayError.prototype);
  }
}

// CredentialsSignin errors

export class InternalServerError extends CredentialsSignin {
  constructor() {
    super(AuthErrorCode.InternalServerError);
  }
  code = AuthErrorCode.InternalServerError;
  stack = undefined;
}

export class IncorrectEmailOrPasswordError extends CredentialsSignin {
  constructor() {
    super(AuthErrorCode.IncorrectEmailOrPassword);
  }
  code = AuthErrorCode.IncorrectEmailOrPassword;
  stack = undefined;
}

export class TotpCodeRequiredError extends CredentialsSignin {
  constructor() {
    super(AuthErrorCode.TotpCodeRequired);
  }
  code = AuthErrorCode.TotpCodeRequired;
  stack = undefined;
}

export class IncorrectTotpCodeError extends CredentialsSignin {
  constructor() {
    super(AuthErrorCode.IncorrectTotpCode);
  }
  code = AuthErrorCode.IncorrectTotpCode;
  stack = undefined;
}

export class MissingRecoveryCodesError extends CredentialsSignin {
  constructor() {
    super(AuthErrorCode.MissingRecoveryCodes);
  }
  code = AuthErrorCode.MissingRecoveryCodes;
  stack = undefined;
}

export class IncorrectRecoveryCodeError extends CredentialsSignin {
  constructor() {
    super(AuthErrorCode.IncorrectRecoveryCode);
  }
  code = AuthErrorCode.IncorrectRecoveryCode;
  stack = undefined;
}

export class UnverifiedEmailError extends CredentialsSignin {
  constructor() {
    super(AuthErrorCode.UnverifiedEmail);
  }
  code = AuthErrorCode.UnverifiedEmail;
  stack = undefined;
}

export class RequestExpiredError extends CredentialsSignin {
  constructor() {
    super(AuthErrorCode.RequestExpired);
  }
  code = AuthErrorCode.RequestExpired;
  stack = undefined;
}

export class RateLimitExceededError extends CredentialsSignin {
  constructor() {
    super(AuthErrorCode.RateLimitExceeded);
  }
  code = AuthErrorCode.RateLimitExceeded;
  stack = undefined;
}
