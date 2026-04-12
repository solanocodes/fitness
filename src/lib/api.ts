const BASE = '';

async function request(url: string, options?: RequestInit) {
  const res = await fetch(`${BASE}${url}`, options);
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || res.statusText);
  }
  return res.json();
}

export const api = {
  // Body Stats
  getBodyStats: () => request('/api/body-stats'),
  addBodyStat: (data: any) =>
    request('/api/body-stats', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }),

  // Meals
  getMeals: (date?: string) =>
    request(`/api/meals${date ? `?date=${date}` : ''}`),
  addMeal: (formData: FormData) =>
    request('/api/meals', { method: 'POST', body: formData }),

  // Workouts
  getWorkouts: () => request('/api/workouts'),
  addWorkout: (data: any) =>
    request('/api/workouts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }),

  // InBody
  getInBody: () => request('/api/inbody'),
  addInBody: (data: any) =>
    request('/api/inbody', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }),

  // Progress Photos
  getPhotos: () => request('/api/progress-photos'),
  addPhoto: (formData: FormData) =>
    request('/api/progress-photos', { method: 'POST', body: formData }),

  // Daily Log
  getDailyLog: () => request('/api/daily-log/today'),
  addDailyLog: (data: any) =>
    request('/api/daily-log', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }),

  // Forge Score
  getForgeScore: () => request('/api/forge-score'),
  getForgeScoreHistory: () => request('/api/forge-score/history'),

  // Achievements
  getAchievements: () => request('/api/achievements'),

  // Analyze Meal
  analyzeMeal: (formData: FormData) =>
    request('/api/analyze-meal', { method: 'POST', body: formData }),
  analyzeMealText: (description: string) =>
    request('/api/analyze-meal-text', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ description }),
    }),

  // Saved Meals
  getSavedMeals: () => request('/api/saved-meals'),
  addSavedMeal: (data: any) =>
    request('/api/saved-meals', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }),
  deleteSavedMeal: (id: number) =>
    request(`/api/saved-meals/${id}`, { method: 'DELETE' }),
};
