import mongoose from 'mongoose';

export const PRIORITIES = ['low', 'medium', 'high'];
// "Open" on the week cards means any status other than completed.
export const STATUSES = ['pending', 'in_progress', 'completed'];

export const LIMITS = { title: 120, description: 1000 };

const taskSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true, maxlength: LIMITS.title },
    description: { type: String, trim: true, maxlength: LIMITS.description, default: '' },
    dueAt: { type: Date, required: true }, // start date & time (required)
    endAt: { type: Date, default: null }, // optional end time, after dueAt
    priority: { type: String, enum: [...PRIORITIES, null], default: null },
    status: { type: String, enum: STATUSES, default: 'pending' },
    completedAt: { type: Date, default: null },
  },
  {
    timestamps: true,
    toJSON: {
      versionKey: false,
      transform(_doc, ret) {
        ret.id = ret._id.toString();
        delete ret._id;
        return ret;
      },
    },
  },
);

// Week views and range queries filter and sort on the due date.
taskSchema.index({ dueAt: 1 });

export const Task = mongoose.models.Task || mongoose.model('Task', taskSchema);
