import { Router } from "express";
import { WorkflowExampleModel } from "@quantnest-trading/db/client";

const examplesRouter = Router();

examplesRouter.get("/", async (req, res) => {
  try {
    const examples = await WorkflowExampleModel.find({})
      .sort({ sortOrder: 1, createdAt: 1 })
      .lean();

    res.status(200).json({
      message: "Examples fetched successfully",
      examples,
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch examples",
    });
  }
});

export default examplesRouter;
