import { Routes, Route } from "react-router-dom";
import { Analytics } from "@vercel/analytics/react";
import ProtectedRoute from "./components/ProtectedRoute";
import Login from "./pages/Login";
import Onboarding from "./pages/Onboarding";
import AppShell from "./components/AppShell";
import Chat from "./pages/Chat";
import Settings from "./pages/Settings";
import Surveys from "./pages/Surveys";
import PublicSurvey from "./pages/PublicSurvey";

function App() {
  return (
    <>
      <Analytics />
      <Routes>
        <Route path="/s/:id" element={<PublicSurvey />} />
        <Route path="/login" element={<Login />} />
        <Route
          path="/onboarding"
          element={
            <ProtectedRoute>
              <Onboarding />
            </ProtectedRoute>
          }
        />
        <Route
          path="/*"
          element={
            <ProtectedRoute>
              <AppShell />
            </ProtectedRoute>
          }
        >
          <Route index element={<Chat />} />
          <Route path="settings" element={<Settings />} />
          <Route path="surveys" element={<Surveys />} />
        </Route>
      </Routes>
    </>
  );
}

export default App;