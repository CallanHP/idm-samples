/*
 * Lookup for details of how to work with individual MFA factors
 */
interface FactorDetails {
  [key:string] :FactorDetail
}

interface FactorDetail {
  getloginDescription: (display:string)=>string;
  enrollmentDisplay: string;
  enrollmentDescription: string;
  enrollNoDetails: boolean;
  requiresInitiation: boolean;
  defaultCredentials?: MfaCredential;
  getVerifyDescription?: (display:string)=>string;
}

interface MfaCredential {
  [key:string]: string|boolean;
}

const factorDetails:FactorDetails = {
  SMS:{
    getloginDescription: (display:string) => {
      return `Send a verification code by SMS to ${display || "your registered mobile number"}`
    },
    enrollmentDisplay: "Add a mobile number to recieve verification codes by SMS",
    enrollmentDescription: "Enter a mobile number including country code to recieve verification codes by SMS.",
    getVerifyDescription: (display:string) =>{
      return `A Verification Code has been sent to ${display}.`
    },
    // Do we invoke the enroll API before loading the details screen?
    enrollNoDetails: false,
    // Is there a call required to initialise verification of the factor?
    requiresInitiation: true
  },
  TOTP:{
    getloginDescription: (display:string) => {
      return `Use the passcode that is generated by ${display?`the authenticator app on ${display}`:"your authenticator app"}`
    },
    enrollmentDisplay: "Enroll an offline mobile authenticator app (i.e. Google Authenticator)",
    enrollmentDescription: "Open your Authenticator App and add a new account, scan the QR code below, then enter the displayed code in the box below.",
    getVerifyDescription: (display:string) =>{
      return `Open your Authenticator App, then enter the displayed code for this account.`;
    },
    enrollNoDetails: true,
    requiresInitiation: false,
    defaultCredentials: {offlineTotp:true}
  },
  EMAIL:{
    getloginDescription: (display:string) => {
      return `Send a verification code by email to ${display || "your registered email address"}`
    },
    enrollmentDisplay: "Recieve verification codes via email.",
    enrollmentDescription: "",
    enrollNoDetails: false,
    requiresInitiation: true,
    getVerifyDescription: (display:string) =>{
      return `A Verification Code has been sent to ${display}.`
    }
  },
  PUSH:{
    getloginDescription: (display: string) => {
      return `Send a notification to ${display || "Oracle Mobile Authenticator"}`
    },
    enrollmentDisplay: "Enroll Oracle Mobile Authenticator",
    enrollmentDescription: "Open Oracle Mobile Authenticator and scan the QR code below.",
    enrollNoDetails: true,
    requiresInitiation: true,
    getVerifyDescription: (display:string) =>{
      return `A notification has been sent to ${display}. Open the notification, and then tap Allow to continue.`
    }
  },
  BYPASS:{
    getloginDescription: (display: string) => {
      return "Enter a registered bypass code"
    },
    enrollmentDisplay: "Add a Bypass Code",
    enrollmentDescription: "",
    enrollNoDetails: false,
    requiresInitiation: false,
  },
  SECURITY_QUESTIONS:{
    getloginDescription: (display: string) => {
      return "Answer your registered security questions"
    },
    enrollmentDisplay: "Add Security Questions to your Account",
    enrollmentDescription: "",
    enrollNoDetails: false,
    requiresInitiation: false
  }
}

export {factorDetails};