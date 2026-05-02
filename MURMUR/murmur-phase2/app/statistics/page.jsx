"use client";

import { useEffect, useState } from "react";

export default function StatisticsPage() {
  const [stats, setStats] = useState(null);

  useEffect(() => {
    async function fetchStats() {
      try {
        const res = await fetch("/api/stats");
        const data = await res.json();
        setStats(data);
      } catch (err) {
        console.error("Failed to load stats", err);
      }
    }

    fetchStats();
  }, []);

  if (!stats) {
    return <div style={{ padding: "20px" }}>Loading stats...</div>;
  }

  return (
    <div style={styles.page}>
      <h1 style={styles.title}>Platform Statistics</h1>

      <div style={styles.grid}>
        <div style={styles.card}>
          <h3>Total Users</h3>
          <p>{stats.totalUsers}</p>
        </div>

        <div style={styles.card}>
          <h3>Total Posts</h3>
          <p>{stats.totalPosts}</p>
        </div>

        <div style={styles.card}>
          <h3>Total Comments</h3>
          <p>{stats.totalComments}</p>
        </div>

        <div style={styles.card}>
          <h3>Total Likes</h3>
          <p>{stats.totalLikes}</p>
        </div>

        <div style={styles.card}>
          <h3>Most Active User</h3>
          <p>{stats.mostActiveUser?.[0]?.authorId}</p>
        </div>

        <div style={styles.card}>
          <h3>Most Followed User</h3>
          <p>{stats.mostFollowedUser?.[0]?.followingId}</p>
        </div>

        <div style={styles.card}>
          <h3>Most Liked Post</h3>
          <p>{stats.mostLikedPost?.[0]?.postId}</p>
        </div>

        <div style={styles.card}>
          <h3>Avg Followers</h3>
          <p>{stats.averageFollowers}</p>
        </div>
      </div>
    </div>
  );
}

const styles = {
  page: {
    padding: "40px",
    background: "#0f0f0f",
    color: "white",
    minHeight: "100vh",
  },
  title: {
    marginBottom: "30px",
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
    gap: "20px",
  },
  card: {
    background: "#1c1c1c",
    padding: "20px",
    borderRadius: "10px",
    textAlign: "center",
  },
};