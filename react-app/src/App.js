import './App.css';
import SignUp from './views/SignUp';
import SignIn from './views/SignIn';
import { Route, Routes} from "react-router-dom";
import ConfirmOTP from './views/ConfirmOTP';
import { initializeApp } from "firebase/app";
import Dashboard from './views/Dashboard';
import TopUpBalance from './views/TopUpBalance';
import TopUpSuccess from './views/TopUpSuccess';

function App() {
  const firebaseConfig = {
    apiKey: "AIzaSyBcC2oysbO8tJGsQtE57OyLDQclcJMYWxs",
    authDomain: "fitdesign-18dfb.firebaseapp.com",
    databaseURL: "https://fitdesign-18dfb-default-rtdb.firebaseio.com",
    projectId: "fitdesign-18dfb",
    storageBucket: "fitdesign-18dfb.appspot.com",
    messagingSenderId: "813772686232",
    appId: "1:813772686232:web:986b163c52fd68aa6b21ed"
  };
  
  // Initialize Firebase
  initializeApp(firebaseConfig);

  return (
    <div className="App">
      <header className="App-header">
        <Routes>
          <Route exact path="/" element={<SignUp />} />
          <Route exact path="/signin" element={<SignIn />} />
          <Route exact path="/confirm-otp" element={<ConfirmOTP />} />
          <Route exact path="/dashboard" element={<Dashboard />} />
          <Route exact path="/topup" element={<TopUpBalance />} />
          <Route exact path="/topup-success" element={<TopUpSuccess />} />
        </Routes>
      </header>
    </div>
  );
}

export default App;
