import { Router } from "express";
import { protect, AuthRequest } from "../middleware/auth";
import { Community } from "../models/Community";

const router = Router();



router.get("/my", protect, async (req: AuthRequest, res) => {
  try {
    const communityIds = req.user.communities;
    console.log("User community IDs:", communityIds);

    if (!communityIds || communityIds.length === 0) return res.json([]);

    const communities = await Community.find({ _id: { $in: communityIds } });
    

    res.json(communities);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to fetch communities" });
  }
});

router.get("/:id", protect, async (req: AuthRequest, res) => {
  try {
    const community = await Community.findById(req.params.id);
    if (!community) return res.status(404).json({ message: "Community not found" });
    res.json(community);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch community" });
  }
});

export default router;
