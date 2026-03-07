// frontend/src/pages/Settings.jsx

import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { User, MapPin, DollarSign, Target, Save, Loader2 } from "lucide-react";
import toast from "react-hot-toast";

function Settings() {
  const { user, updatePreferences } = useAuth();
  const [saving, setSaving] = useState(false);

  const [preferences, setPreferences] = useState(null);

  const [newLocation, setNewLocation] = useState("");

  const effectivePreferences = preferences || {
    target_role: user?.target_role || "",
    preferred_locations: user?.preferred_locations || [],
    salary_min: user?.salary_min || "",
    salary_max: user?.salary_max || "",
    career_goals: user?.career_goals || "",
  };

  const handleAddLocation = () => {
    if (
      newLocation.trim() &&
      !effectivePreferences.preferred_locations.includes(newLocation.trim())
    ) {
      setPreferences({
        ...effectivePreferences,
        preferred_locations: [
          ...effectivePreferences.preferred_locations,
          newLocation.trim(),
        ],
      });
      setNewLocation("");
    }
  };

  const handleRemoveLocation = (loc) => {
    setPreferences({
      ...effectivePreferences,
      preferred_locations: effectivePreferences.preferred_locations.filter(
        (l) => l !== loc,
      ),
    });
  };

  const handleSave = async () => {
    setSaving(true);

    const data = {
      ...effectivePreferences,
      salary_min: effectivePreferences.salary_min
        ? parseInt(effectivePreferences.salary_min)
        : null,
      salary_max: effectivePreferences.salary_max
        ? parseInt(effectivePreferences.salary_max)
        : null,
    };

    const result = await updatePreferences(data);

    if (result.success) {
      toast.success("Preferences saved!");
    }

    setSaving(false);
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-fadeIn">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-600 mt-1">
          Manage your account and preferences
        </p>
      </div>

      {/* Profile Info */}
      <div className="card">
        <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <User className="w-5 h-5 text-gray-600" />
          Profile Information
        </h2>

        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Full Name
            </label>
            <input
              type="text"
              value={user?.full_name || ""}
              className="input bg-gray-50"
              disabled
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <input
              type="email"
              value={user?.email || ""}
              className="input bg-gray-50"
              disabled
            />
          </div>
        </div>
      </div>

      {/* Career Preferences */}
      <div className="card">
        <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Target className="w-5 h-5 text-gray-600" />
          Career Preferences
        </h2>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Target Role
            </label>
            <input
              type="text"
              value={effectivePreferences.target_role}
              onChange={(e) =>
                setPreferences({
                  ...effectivePreferences,
                  target_role: e.target.value,
                })
              }
              className="input"
              placeholder="e.g., Senior Software Engineer"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Career Goals
            </label>
            <textarea
              value={effectivePreferences.career_goals}
              onChange={(e) =>
                setPreferences({
                  ...effectivePreferences,
                  career_goals: e.target.value,
                })
              }
              className="input min-h-[100px]"
              placeholder="Describe your career goals..."
            />
          </div>
        </div>
      </div>

      {/* Location Preferences */}
      <div className="card">
        <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <MapPin className="w-5 h-5 text-gray-600" />
          Location Preferences
        </h2>

        <div className="flex gap-2 mb-4">
          <input
            type="text"
            value={newLocation}
            onChange={(e) => setNewLocation(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleAddLocation()}
            className="input flex-1"
            placeholder="Add location (e.g., San Francisco, Remote)"
          />
          <button onClick={handleAddLocation} className="btn-secondary">
            Add
          </button>
        </div>

        <div className="flex flex-wrap gap-2">
          {effectivePreferences.preferred_locations.map((loc, idx) => (
            <span
              key={idx}
              className="inline-flex items-center gap-1 px-3 py-1 bg-primary-100 text-primary-700 rounded-full text-sm"
            >
              {loc}
              <button
                onClick={() => handleRemoveLocation(loc)}
                className="hover:text-primary-900"
              >
                ×
              </button>
            </span>
          ))}
          {effectivePreferences.preferred_locations.length === 0 && (
            <p className="text-sm text-gray-500">No locations added</p>
          )}
        </div>
      </div>

      {/* Salary Expectations */}
      <div className="card">
        <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <DollarSign className="w-5 h-5 text-gray-600" />
          Salary Expectations
        </h2>

        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Minimum Salary
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
                $
              </span>
              <input
                type="number"
                value={effectivePreferences.salary_min}
                onChange={(e) =>
                  setPreferences({
                    ...effectivePreferences,
                    salary_min: e.target.value,
                  })
                }
                className="input pl-7"
                placeholder="e.g., 80000"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Maximum Salary
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
                $
              </span>
              <input
                type="number"
                value={effectivePreferences.salary_max}
                onChange={(e) =>
                  setPreferences({
                    ...effectivePreferences,
                    salary_max: e.target.value,
                  })
                }
                className="input pl-7"
                placeholder="e.g., 150000"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Save Button */}
      <div className="flex justify-end">
        <button
          onClick={handleSave}
          disabled={saving}
          className="btn-primary flex items-center gap-2"
        >
          {saving ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <Save className="w-5 h-5" />
          )}
          Save Preferences
        </button>
      </div>
    </div>
  );
}

export default Settings;
