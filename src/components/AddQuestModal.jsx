import { useState, useEffect, useRef } from "react";
import { CATEGORIES } from "../utils/constants";
import { generateId } from "../utils/gameLogic";

export default function AddQuestModal({ onAdd, onClose }) {
  const [name, setName] = useState("");
  const [category, setCategory] = useState("learning");
  const [stepsText, setStepsText] = useState("");
  const nameRef = useRef(null);

  useEffect(() => {
    nameRef.current?.focus();
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim() || !stepsText.trim()) return;
    const steps = stepsText
      .split("\n")
      .map((s) => s.trim())
      .filter(Boolean)
      .map((text) => ({ id: generateId(), text, done: false }));
    if (steps.length === 0) return;
    onAdd({ name: name.trim(), category, steps });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-fade-in" onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} className="bg-white rounded-3xl shadow-2xl max-w-lg w-full p-8 max-h-[90vh] overflow-y-auto animate-scale-in">
        <h2 className="text-2xl font-black text-gray-800 mb-6 flex items-center gap-2">
          <span>✍️</span> 手动创建任务
        </h2>
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-semibold text-gray-600 mb-1.5">任务名称</label>
            <input
              ref={nameRef}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="例：学完 React 基础课程"
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-indigo-400 focus:outline-none text-gray-800 text-base"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-600 mb-1.5">分类</label>
            <div className="grid grid-cols-2 gap-2">
              {Object.entries(CATEGORIES).map(([key, cat]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setCategory(key)}
                  className={`px-4 py-2.5 rounded-xl text-sm font-semibold transition-all
                    ${category === key ? `${cat.badge} ring-2 ring-offset-1 ring-current` : "bg-gray-100 text-gray-500 hover:bg-gray-200"}
                  `}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-600 mb-1.5">
              步骤拆分 <span className="font-normal text-gray-400">（每行一个步骤）</span>
            </label>
            <textarea
              value={stepsText}
              onChange={(e) => setStepsText(e.target.value)}
              rows={6}
              placeholder={"观看第1章视频\n做第1章练习题\n总结笔记\n观看第2章视频\n做第2章练习题"}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-indigo-400 focus:outline-none text-gray-800 text-base resize-none"
            />
            <div className="text-xs text-gray-400 mt-1">
              💡 ADHD 提示：步骤越小，启动越容易。
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 py-3 rounded-xl bg-gray-100 text-gray-600 font-semibold hover:bg-gray-200 transition-all">
              取消
            </button>
            <button
              type="submit"
              disabled={!name.trim() || !stepsText.trim()}
              className="flex-1 py-3 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-bold hover:shadow-lg disabled:opacity-40 transition-all"
            >
              创建任务
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
