import mongoose from 'mongoose';

const PostSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true, maxlength: 180 },
    content: { type: String, required: true },
    coverImage: { type: String },
    tags: { type: [String], default: [] },
    authorName: { type: String, default: 'Anonymous' },
    authorId: { type: String, required: true },
    status: { type: String, enum: ['draft', 'published'], default: 'published' },
  },
  { timestamps: true }
);

export default mongoose.models.Post || mongoose.model('Post', PostSchema);
