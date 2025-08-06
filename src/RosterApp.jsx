// 📦 Final RosterApp.jsx with Copy Previous Week + Auto Save
import React, { useState, useEffect } from "react";
import * as XLSX from "xlsx";
import {
  Calendar,
  User,
  Lock,
  LogOut,
  Download,
  Upload,
  Plus,
} from "lucide-react";

const RosterApp = () => {
  const [mode, setMode] = useState(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loginForm, setLoginForm] = useState({ username: "", password: "" });
  const [loginError, setLoginError] = useState("");
  const [currentUser, setCurrentUser] = useState("");
  const [employeeFilter, setEmployeeFilter] = useState("");

  const validUsers = {
    admin: "admin123",
    caroline: "cs123",
    werribee: "wp123",
    geelong: "ge123",
    pointcook: "pc123",
    woodgrove: "wg123",
  };

  const [employees, setEmployees] = useState([
    "Bhanush",
    "Girish",
    "Aravind",
    "Vansh",
    "Kashish",
    "Sonam",
    "Tejal",
    "Anshul",
    "Matt",
    "Aswin",
  ]);

  const [locations] = useState([
    "Caroline Springs",
    "Werribee Plaza",
    "Point Cook",
    "Geelong",
    "Woodgrove",
  ]);

  const [currentWeekStart, setCurrentWeekStart] = useState(new Date());
  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const monthNames = [
    "Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"
  ];

  const getCurrentWeekDates = () => {
    const days = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(currentWeekStart);
      date.setDate(currentWeekStart.getDate() + i);
      days.push(`${dayNames[date.getDay()]} ${date.getDate()}-${monthNames[date.getMonth()]}`);
    }
    return days;
  };
  const days = getCurrentWeekDates();

  const getCurrentWeekKey = () => `${monthNames[currentWeekStart.getMonth()]}-${currentWeekStart.getDate()}-${currentWeekStart.getFullYear()}`;

  const loadSavedData = () => {
    const saved = localStorage.getItem("rosterData");
    return saved ? JSON.parse(saved) : {};
  };

  const [allRosterData, setAllRosterData] = useState(() => loadSavedData());

  useEffect(() => {
    localStorage.setItem("rosterData", JSON.stringify(allRosterData));
  }, [allRosterData]);

  const navigateWeek = (dir) => {
    setCurrentWeekStart((prev) => {
      const newDate = new Date(prev);
      newDate.setDate(prev.getDate() + dir * 7);
      return newDate;
    });
  };

  const calculateHours = (start, end, leaveType) => {
    if (leaveType || !start || !end) return 0;
    const s = new Date(`2024-01-01 ${start}`);
    const e = new Date(`2024-01-01 ${end}`);
    let diff = (e - s) / (1000 * 60 * 60);
    if (diff > 4) diff -= 0.5;
    return diff > 0 ? diff : 0;
  };

  const getWeeklySummary = (employee) => {
    let total = 0;
    const weekRoster = allRosterData[getCurrentWeekKey()] || {};
    locations.forEach((loc) => {
      days.forEach((day) => {
        (weekRoster[loc]?.[day] || []).forEach((shift) => {
          if (shift.employee === employee) {
            total += calculateHours(shift.scheduledStart, shift.scheduledEnd);
          }
        });
      });
    });
    return total;
  };

  const exportToExcel = (type) => {
    const wb = XLSX.utils.book_new();
    const weekRoster = allRosterData[getCurrentWeekKey()] || {};

    if (type === "roster") {
      const rows = [];
      locations.forEach((loc) => {
        days.forEach((day) => {
          (weekRoster[loc]?.[day] || []).forEach((shift) => {
            rows.push({
              Location: loc,
              Day: day,
              Employee: shift.employee,
              Start: shift.scheduledStart,
              End: shift.scheduledEnd,
              Hours: calculateHours(shift.scheduledStart, shift.scheduledEnd, shift.leaveType),
            });
          });
        });
      });
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(rows), "Roster");
    } else {
      const rows = employees.map((emp) => ({
        Employee: emp,
        "Total Hours": getWeeklySummary(emp),
      }));
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(rows), "Summary");
    }
    XLSX.writeFile(wb, `Roster_${type}_${getCurrentWeekKey()}.xlsx`);
  };

  const copyPreviousWeek = () => {
    const prevStart = new Date(currentWeekStart);
    prevStart.setDate(prevStart.getDate() - 7);
    const prevKey = `${monthNames[prevStart.getMonth()]}-${prevStart.getDate()}-${prevStart.getFullYear()}`;
    if (allRosterData[prevKey]) {
      setAllRosterData((prev) => ({
        ...prev,
        [getCurrentWeekKey()]: JSON.parse(JSON.stringify(prev[prevKey]))
      }));
      alert("Previous week roster copied!");
    } else {
      alert("No previous week data found");
    }
  };

  const handleLogin = () => {
    if (mode === "shared") {
      setIsLoggedIn(true);
      setCurrentUser("Admin");
      return;
    }
    if (validUsers[loginForm.username] === loginForm.password) {
      setIsLoggedIn(true);
      setCurrentUser(loginForm.username);
    } else {
      setLoginError("Invalid username or password");
    }
  };

  if (!mode) {
    return (
      <div className="flex flex-col items-center justify-center h-screen gap-4">
        <h1 className="text-2xl font-bold">Select Access Mode</h1>
        <button onClick={() => setMode("shared")} className="bg-blue-600 text-white px-6 py-3 rounded-lg">Shared Roster Mode</button>
        <button onClick={() => setMode("multi")} className="bg-green-600 text-white px-6 py-3 rounded-lg">Multi-Location Mode</button>
      </div>
    );
  }

  if (!isLoggedIn) {
    return (
      <div className="flex flex-col items-center justify-center h-screen gap-4">
        <h2 className="text-xl font-bold mb-2">{mode === "shared" ? "Shared Roster" : "Login to Your Location"}</h2>
        {mode === "multi" && (
          <>
            <input type="text" placeholder="Username" value={loginForm.username} onChange={(e) => setLoginForm({ ...loginForm, username: e.target.value })} className="border px-3 py-2" />
            <input type="password" placeholder="Password" value={loginForm.password} onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })} className="border px-3 py-2" />
          </>
        )}
        <button onClick={handleLogin} className="bg-blue-600 text-white px-6 py-2 rounded-lg">{mode === "shared" ? "Continue" : "Login"}</button>
        {loginError && <p className="text-red-500">{loginError}</p>}
      </div>
    );
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Roster Management</h1>
        <button onClick={() => setIsLoggedIn(false)} className="bg-red-500 text-white px-4 py-2 rounded-lg">Logout</button>
      </div>

      <div className="flex gap-2 mb-4">
        <button onClick={() => exportToExcel("roster")} className="bg-green-600 text-white px-4 py-2 rounded-lg flex items-center gap-2"><Download size={18}/> Export Roster</button>
        <button onClick={() => exportToExcel("summary")} className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2"><Download size={18}/> Export Summary</button>
        <button onClick={copyPreviousWeek} className="bg-purple-600 text-white px-4 py-2 rounded-lg flex items-center gap-2"><Upload size={18}/> Copy Previous Week</button>
      </div>

      <div className="mb-4">
        <label className="font-medium mr-2">Filter by Employee:</label>
        <select value={employeeFilter} onChange={(e) => setEmployeeFilter(e.target.value)} className="border px-3 py-2">
          <option value="">All Employees</option>
          {employees.map((emp) => <option key={emp} value={emp}>{emp}</option>)}
        </select>
      </div>

      <div className="overflow-x-auto">
        <table className="border w-full">
          <thead>
            <tr>
              <th className="border p-2">Location</th>
              {days.map((d) => <th key={d} className="border p-2">{d}</th>)}
            </tr>
          </thead>
          <tbody>
            {locations.map((loc) => (
              <tr key={loc}>
                <td className="border p-2 font-bold">{loc}</td>
                {days.map((day) => (
                  <td key={day} className="border p-2 align-top">
                    {(allRosterData[getCurrentWeekKey()]?.[loc]?.[day] || [])
                      .filter((s) => !employeeFilter || s.employee === employeeFilter)
                      .map((shift, idx) => (
                        <div key={idx} className="border p-1 mb-1 bg-gray-50">
                          <div className="font-medium">{shift.employee}</div>
                          <div className="text-xs">
                            {shift.scheduledStart} - {shift.scheduledEnd} ({calculateHours(shift.scheduledStart, shift.scheduledEnd, shift.leaveType)}h)
                          </div>
                        </div>
                      ))}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default RosterApp;