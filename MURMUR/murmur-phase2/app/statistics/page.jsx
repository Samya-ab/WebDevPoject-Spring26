"use client";

import { useEffect, useState } from "react";
import styles from "../page.module.css";

export default function StatisticsPage() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await fetch("/api/stats");

        if (!res.ok) {
          throw new Error("Failed to load stats");
        }

        const data = await res.json();
        setStats(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className={styles.page}>
        <main className={styles.main}>
          <h1>Loading statistics...</h1>
        </main>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.page}>
        <main className={styles.main}>
          <h1>Error</h1>
          <p>{error}</p>
        </main>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <main className={styles.main}>
        <h1>📊 Platform Statistics</h1>

        <div className={styles.ctas}>
          {/* BASIC COUNTS */}
          <div className={styles.secondary}>
            <h3>Total Users</h3>
            <p>{stats.totalUsers}</p>
          </div>

          <div className={styles.secondary}>
            <h3>Total Posts</h3>
            <p>{stats.totalPosts}</p>
          </div>

          <div className={styles.secondary}>
            <h3>Total Comments</h3>
            <p>{stats.totalComments}</p>
          </div>

          <div className={styles.secondary}>
            <h3>Total Likes</h3>
            <p>{stats.totalLikes}</p>
          </div>

          {/* ADVANCED STATS */}
          <div className={styles.secondary}>
            <h3>Most Active User</h3>
            <p>
              User ID:{" "}
              {stats.mostActiveUser?.[0]?.authorId ?? "N/A"}
            </p>
          </div>

          <div className={styles.secondary}>
            <h3>Most Followed User</h3>
            <p>
              User ID:{" "}
              {stats.mostFollowedUser?.[0]?.followingId ?? "N/A"}
            </p>
          </div>

          <div className={styles.secondary}>
            <h3>Most Liked Post</h3>
            <p>
              Post ID:{" "}
              {stats.mostLikedPost?.[0]?.postId ?? "N/A"}
            </p>
          </div>

          <div className={styles.secondary}>
            <h3>Average Followers</h3>
            <p>{stats.averageFollowers?.toFixed(2) ?? 0}</p>
          </div>
        </div>
      </main>
    </div>
  );
}