import {
  getAuth,
  RecaptchaVerifier,
  signInWithPhoneNumber,
} from "firebase/auth";

function configureCaptcha() {
  const auth = getAuth();
  window.recaptchaVerifier = new RecaptchaVerifier(
    "sign-in-button",
    {
      size: "invisible",
      callback: (response) => {
        // reCAPTCHA solved, allow signInWithPhoneNumber.
        sendOTP();
      },
    },
    auth
  );
}

export async function sendOTP(phoneNumber) {
  if (phoneNumber !== undefined) {
    console.log("phone number", phoneNumber);
    configureCaptcha();
    const appVerifier = window.recaptchaVerifier;
    const auth = getAuth();
    await signInWithPhoneNumber(auth, phoneNumber, appVerifier)
      .then((confirmationResult) => {
        // SMS sent. Prompt user to type the code from the message, then sign the
        // user in with confirmationResult.confirm(code).
        window.confirmationResult = confirmationResult;
        console.log("OTP sent");
        //   window.location.replace(url+'/confirm-otp')
        // ...
      })
      .catch((error) => {
        // Error; SMS not sent
        // ...
        console.log(error);
        console.log("error otp");
      });
  }
}
