import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import {
  getTotalUsers,
  getTotalPosts,
  getTotalComments,
  getTotalLikes,
  getMostActiveUser,
  getMostFollowedUser,
  getMostLikedPost,
  getAverageFollowers
} from "@/repos/stats.js";

export async function GET() {
  const cookieStore = await cookies();
  const currentUserID = cookieStore.get("userId")?.value;

  if (!currentUserID) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const totalUsers = await getTotalUsers();
  const totalPosts = await getTotalPosts();
  const totalComments = await getTotalComments();
  const totalLikes = await getTotalLikes();
  const mostActiveUser = await getMostActiveUser();
  const mostFollowedUser = await getMostFollowedUser();
  const mostLikedPost = await getMostLikedPost();
  const averageFollowers = await getAverageFollowers();

  // Check errors one by one (matching team style)
  const results = [
    totalUsers,
    totalPosts,
    totalComments,
    totalLikes,
    mostActiveUser,
    mostFollowedUser,
    mostLikedPost,
    averageFollowers
  ];

  for (const r of results) {
    if (r.error) {
      return NextResponse.json(
        { error: r.error.message },
        { status: r.error.status }
      );
    }
  }

  return NextResponse.json({
    totalUsers: totalUsers.data,
    totalPosts: totalPosts.data,
    totalComments: totalComments.data,
    totalLikes: totalLikes.data,
    mostActiveUser: mostActiveUser.data,
    mostFollowedUser: mostFollowedUser.data,
    mostLikedPost: mostLikedPost.data,
    averageFollowers: averageFollowers.data
  });
}