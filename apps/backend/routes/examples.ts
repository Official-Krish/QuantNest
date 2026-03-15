import { Router } from "express";
import { WorkflowExampleModel, WorkflowModel } from "@quantnest-trading/db/client";
import { authMiddleware } from "../middleware";

const examplesRouter = Router();

function normalizeExampleNodes(nodes: any[] = []) {
  return nodes.map((node) => {
    const normalizedId = String(node.id || node.nodeId || "");

    return {
      ...node,
      id: normalizedId,
      nodeId: normalizedId,
    };
  });
}

function applyMetadataOverrides(
  nodes: any[] = [],
  metadataOverrides: Record<string, Record<string, unknown>> = {},
) {
  return nodes.map((node) => {
    const nodeKey = String(node.nodeId || node.id || "");
    const override = metadataOverrides[nodeKey];

    if (!override) {
      return node;
    }

    return {
      ...node,
      data: {
        ...node.data,
        metadata: {
          ...(node.data?.metadata || {}),
          ...override,
        },
      },
    };
  });
}

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

examplesRouter.post("/:slug/create", authMiddleware, async (req, res) => {
  const userId = req.userId;
  const slug = String(req.params.slug || "");
  const workflowName = String(req.body?.workflowName || "").trim();
  const metadataOverrides =
    typeof req.body?.metadataOverrides === "object" && req.body?.metadataOverrides
      ? (req.body.metadataOverrides as Record<string, Record<string, unknown>>)
      : {};

  if (!userId) {
    res.status(401).json({ message: "Unauthorized" });
    return;
  }

  if (workflowName.length < 3 || workflowName.length > 100) {
    res.status(400).json({ message: "Workflow name must be between 3 and 100 characters." });
    return;
  }

  try {
    const example = await WorkflowExampleModel.findOne({ slug }).lean();

    if (!example) {
      res.status(404).json({ message: "Example not found" });
      return;
    }

    const normalizedNodes = normalizeExampleNodes(
      applyMetadataOverrides(example.nodes || [], metadataOverrides),
    );

    const workflow = await WorkflowModel.create({
      workflowName,
      userId,
      nodes: normalizedNodes,
      edges: example.edges,
      status: "paused",
    });

    res.status(200).json({
      message: "Workflow created from example",
      workflowId: workflow._id,
    });
  } catch (error) {
    res.status(500).json({ message: "Failed to create workflow from example" });
    console.error("Error creating workflow from example:", error);
  }
});

export default examplesRouter;