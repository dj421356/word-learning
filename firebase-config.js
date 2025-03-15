// Firebase 配置
const firebaseConfig = {
    // 这里需要替换为您的 Firebase 配置信息
    apiKey: "YOUR_API_KEY",
    authDomain: "your-app.firebaseapp.com",
    projectId: "your-app",
    storageBucket: "your-app.appspot.com",
    messagingSenderId: "your-sender-id",
    appId: "your-app-id",
    databaseURL: "https://your-app.firebaseio.com"
};

// 初始化 Firebase
firebase.initializeApp(firebaseConfig); 