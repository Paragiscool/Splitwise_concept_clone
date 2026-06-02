const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

export const fetchUsers = async () => {
  const res = await fetch(`${API_URL}/users`);
  return res.json();
};

export const fetchUserGroups = async (userId) => {
  const res = await fetch(`${API_URL}/users/${userId}/groups`);
  return res.json();
};

export const createGroup = async (name, creatorId) => {
  const res = await fetch(`${API_URL}/groups?creator_id=${creatorId}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name }),
  });
  return res.json();
};

export const createExpense = async (groupId, payload) => {
  const res = await fetch(`${API_URL}/groups/${groupId}/expenses`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    throw new Error(await res.text());
  }
  return res.json();
};

export const fetchGroupExpenses = async (groupId) => {
  const res = await fetch(`${API_URL}/groups/${groupId}/expenses`);
  return res.json();
};

export const createSettlement = async (groupId, payload) => {
  const res = await fetch(`${API_URL}/groups/${groupId}/settlements`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    throw new Error(await res.text());
  }
  return res.json();
};

export const fetchGroupDebts = async (groupId) => {
  const res = await fetch(`${API_URL}/groups/${groupId}/debts`);
  return res.json();
};

export const removeGroupMember = async (groupId, userId) => {
  const res = await fetch(`${API_URL}/groups/${groupId}/members/${userId}`, {
    method: "DELETE",
  });
  if (!res.ok) {
    throw new Error(await res.text());
  }
  return res.json();
};

export const fetchGroupMembers = async (groupId) => {
  const res = await fetch(`${API_URL}/groups/${groupId}/members`);
  if (!res.ok) {
    throw new Error(await res.text());
  }
  return res.json();
};

export const addGroupMember = async (groupId, userId) => {
  const res = await fetch(`${API_URL}/groups/${groupId}/members`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ user_id: userId }),
  });
  if (!res.ok) {
    throw new Error(await res.text());
  }
  return res.json();
};
