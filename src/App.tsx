import React, { useState, useEffect } from "react";
import {
  Ticket,
  Info,
  Navigation,
  Train,
  Plus,
  Trash2,
  Lock,
  Unlock,
  GripVertical,
  Clock,
  Bus,
  X,
  ExternalLink,
} from "lucide-react";

interface Spot {
  time: string;
  title: string;
  note: string;
  detail: string;
  link: string;
  imageUrl?: string;
  transportAfter: {
    type: string;
    line: string;
    duration: string;
    note: string;
  };
}

interface DayData {
  tickets: { id: number; name: string; status: string }[];
  spots: Spot[];
}

const TravelPlanner = () => {
  const [isLocked, setIsLocked] = useState(false);
  const [activeDay, setActiveDay] = useState("1");
  const [selectedSpot, setSelectedSpot] = useState<Spot | null>(null);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [draggedItemIndex, setDraggedItemIndex] = useState<number | null>(null);

  // 初始化資料 (包含 Google Maps 連結範例)
  const getInitialData = (): Record<string, DayData> => {
    const saved = localStorage.getItem('travelPlannerData');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Failed to parse saved data:', e);
      }
    }
    return {
      "1": {
        tickets: [{ id: 1, name: "JR Pass 兌換券", status: "KIX 領取" }],
        spots: [
          {
            time: "05:30",
            title: "關西國際機場 (KIX)",
            note: "辦理入境並換票",
            detail:
              "使用 Visit Japan Web 入境。連結：https://www.vjw.digital.go.jp/",
            link: "https://maps.app.goo.gl/KIX_Link",
            imageUrl: "https://via.placeholder.com/400x220?text=KIX+Airport",
            transportAfter: {
              type: "train",
              line: "JR Haruka 特急",
              duration: "75m",
              note: "往京都站",
            },
          },
          {
            time: "10:30",
            title: "中村藤吉 宇治本店",
            note: "抹茶排隊名店",
            detail: "推薦：抹茶冰淇淋。官網：https://www.tokichi.jp/",
            link: "https://maps.app.goo.gl/Uji_Tokichi",
            imageUrl: "https://via.placeholder.com/400x220?text=Uji+Tea+Shop",
            transportAfter: {
              type: "walk",
              line: "步行",
              duration: "10m",
              note: "穿過表參道",
            },
          },
        ],
      },
    };
  };

  const [allDaysData, setAllDaysData] = useState<Record<string, DayData>>(getInitialData);

  // 匯出資料
  const exportData = () => {
    const dataStr = JSON.stringify(allDaysData, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    const exportFileDefaultName = 'travel-plan.json';
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  const createEmptyDay = (): DayData => ({
    tickets: [],
    spots: [],
  });

  const addDay = () => {
    const nextDay = (Object.keys(allDaysData).length + 1).toString();
    setAllDaysData({ ...allDaysData, [nextDay]: createEmptyDay() });
    setActiveDay(nextDay);
  };

  const removeDay = (day: string) => {
    const existingDays = Object.keys(allDaysData);
    if (existingDays.length <= 1) return;
    const newData = { ...allDaysData };
    delete newData[day];
    const remainingDays = Object.keys(newData).sort((a, b) => Number(a) - Number(b));
    setAllDaysData(newData);
    setActiveDay(
      activeDay === day ? remainingDays[0] : activeDay
    );
  };

  const addTicket = () => {
    const newData = { ...allDaysData };
    const dayData = { ...newData[activeDay] };
    dayData.tickets = [
      ...dayData.tickets,
      {
        id: Date.now(),
        name: "新票券",
        status: "編輯狀態",
      },
    ];
    newData[activeDay] = dayData;
    setAllDaysData(newData);
  };

  // 輔助函式：判斷並渲染連結
  const renderTextWithLinks = (text: string) => {
    if (isLocked) {
      const urlRegex = /(https?:\/\/[^\s]+)/g;
      const parts = text.split(urlRegex);
      return parts.map((part: string, i: number) =>
        urlRegex.test(part) ? (
          <a
            key={i}
            href={part}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-500 underline break-all"
          >
            {part}
          </a>
        ) : (
          part
        )
      );
    }
    return text;
  };

  const updateContent = (day: string, type: string, index: number, field: string, value: string) => {
    if (isLocked) return;
    const newData = { ...allDaysData };
    (newData[day] as any)[type][index][field] = value;
    setAllDaysData(newData);
  };

  const onDragStart = (index: number) => !isLocked && setDraggedItemIndex(index);
  const onDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (isLocked || draggedItemIndex === null || draggedItemIndex === index) return;
    const items = [...(allDaysData[activeDay] as DayData).spots];
    const draggedItem = items[draggedItemIndex];
    items.splice(draggedItemIndex, 1);
    items.splice(index, 0, draggedItem);
    setDraggedItemIndex(index);
    setAllDaysData({
      ...allDaysData,
      [activeDay]: { ...(allDaysData[activeDay] as DayData), spots: items },
    });
  };

  return (
    <div className="max-w-md mx-auto bg-[#DEDCD5] min-h-screen pb-32 font-sans text-stone-700 antialiased relative">
      {/* 頂部功能條 */}
      <div className="flex justify-between items-center px-8 pt-6">
        <div className="flex gap-2">
          <button
            onClick={exportData}
            className="flex items-center gap-2 px-4 py-2 rounded-full font-bold text-[10px] shadow-sm bg-blue-500 text-white"
          >
            匯出
          </button>
          <button
            onClick={() => {
              const json = prompt('貼上 JSON 資料：');
              if (json) {
                try {
                  const parsed = JSON.parse(json);
                  setAllDaysData(parsed);
                  alert('資料匯入成功！');
                } catch (e) {
                  alert('無效的 JSON 格式');
                }
              }
            }}
            className="flex items-center gap-2 px-4 py-2 rounded-full font-bold text-[10px] shadow-sm bg-green-500 text-white"
          >
            匯入
          </button>
        </div>
        <button
          onClick={() => setIsLocked(!isLocked)}
          className={`flex items-center gap-2 px-4 py-2 rounded-full font-bold text-[10px] shadow-sm transition-all ${
            isLocked ? "bg-red-500 text-white" : "bg-white text-stone-800"
          }`}
        >
          {isLocked ? <Lock size={12} /> : <Unlock size={12} />}
          {isLocked ? "已鎖定" : "編輯中"}
        </button>
        {!isLocked && (
          <div className="flex gap-2">
            <button
              onClick={addDay}
              className="p-2 bg-white/50 rounded-full hover:bg-white transition-colors"
            >
              <Plus size={14} />
            </button>
            <button
              onClick={() => removeDay(activeDay)}
              className="p-2 bg-white/50 rounded-full hover:bg-red-100 text-red-500 transition-colors"
            >
              <Trash2 size={14} />
            </button>
          </div>
        )}
      </div>

      <header className="px-8 pt-4">
        <h1 className="text-stone-800 text-2xl font-black italic tracking-tighter mb-6 underline decoration-stone-400 decoration-4 underline-offset-4">
          TRAVEL LOG
        </h1>

        {/* 天數切換 */}
        <div className="flex gap-3 overflow-x-auto no-scrollbar py-2 border-b border-stone-400/20 mb-6">
          {Object.keys(allDaysData).map((day) => (
            <button
              key={day}
              onClick={() => setActiveDay(day)}
              className={`flex-none w-12 h-16 rounded-2xl flex flex-col items-center justify-center transition-all border ${
                activeDay === day
                  ? "bg-stone-800 border-stone-800 text-white shadow-xl scale-110"
                  : "bg-white/40 border-stone-300 text-stone-500"
              }`}
            >
              <span className="text-[9px] font-bold opacity-60">D{day}</span>
              <span className="text-xl font-black italic">
                {day.padStart(2, "0")}
              </span>
            </button>
          ))}
        </div>

        {/* Daily Tickets */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-3 px-1">
            <span className="text-[10px] font-black text-stone-400 uppercase tracking-widest">
              Daily Tickets
            </span>
            {!isLocked && (
              <Plus
                size={14}
                className="text-stone-400 cursor-pointer hover:text-stone-600"
                onClick={addTicket}
              />
            )}
          </div>
          <div className="flex gap-3 overflow-x-auto no-scrollbar py-1">
            {(allDaysData[activeDay] as DayData)?.tickets.map((t, idx) => (
              <div
                key={t.id}
                className="flex-none bg-white p-3 rounded-2xl border border-stone-200 min-w-[140px] shadow-sm relative group"
              >
                {!isLocked && (
                  <button
                    onClick={() => {
                      const newData = { ...allDaysData };
                      const dayData = { ...newData[activeDay] };
                      dayData.tickets = dayData.tickets.filter((_, ticketIndex) => ticketIndex !== idx);
                      newData[activeDay] = dayData;
                      setAllDaysData(newData);
                    }}
                    className="absolute -top-1 -right-1 bg-red-400 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-sm"
                  >
                    <X size={8} />
                  </button>
                )}
                <div className="flex items-center gap-2 text-stone-400 mb-1">
                  <Ticket size={12} />
                  <span className="text-[9px] font-bold">VOUCHER</span>
                </div>
                <p
                  className="text-[11px] font-black text-stone-800 outline-none"
                  contentEditable={!isLocked}
                  suppressContentEditableWarning
                  onBlur={(e) =>
                    updateContent(
                      activeDay,
                      "tickets",
                      idx,
                      "name",
                      e.target.innerText
                    )
                  }
                >
                  {t.name}
                </p>
                <p
                  className="text-[9px] text-stone-400 italic outline-none"
                  contentEditable={!isLocked}
                  suppressContentEditableWarning
                  onBlur={(e) =>
                    updateContent(
                      activeDay,
                      "tickets",
                      idx,
                      "status",
                      e.target.innerText
                    )
                  }
                >
                  {t.status}
                </p>
              </div>
            ))}
            {(allDaysData[activeDay] as DayData)?.tickets.length === 0 && (
              <div className="text-[10px] text-stone-400 italic py-2 px-1">
                今日尚無票券紀錄
              </div>
            )}
          </div>
        </div>
      </header>

      {/* 行程列表 */}
      <main className="px-6 space-y-0">
        {(allDaysData[activeDay] as DayData)?.spots.map((item: Spot, index: number) => (
          <div key={index}>
            <div
              draggable={!isLocked}
              onDragStart={() => onDragStart(index)}
              onDragOver={(e) => onDragOver(e, index)}
              className={`flex gap-4 transition-all ${
                draggedItemIndex === index
                  ? "opacity-20 scale-95"
                  : "opacity-100"
              }`}
            >
              <div className="flex flex-col items-center w-10 flex-none pt-2">
                <span className="text-[10px] font-black text-stone-500">
                  {item.time}
                </span>
                <div className="w-[2px] h-full bg-stone-300/50 my-2"></div>
              </div>

              <div className="flex-grow pb-4 relative">
                <div className="bg-white rounded-[2rem] p-6 border border-stone-200/50 shadow-md">
                  <div className="flex justify-between items-start mb-2">
                    <h3
                      className="font-black text-lg text-stone-800 outline-none w-full"
                      contentEditable={!isLocked}
                      suppressContentEditableWarning
                      onBlur={(e) =>
                        updateContent(
                          activeDay,
                          "spots",
                          index,
                          "title",
                          e.target.innerText
                        )
                      }
                    >
                      {item.title}
                    </h3>
                    {isLocked && item.link && (
                      <a
                        href={item.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-stone-400 hover:text-blue-500"
                      >
                        <ExternalLink size={16} />
                      </a>
                    )}
                  </div>

                  <div
                    onClick={() => {
                      setSelectedSpot(item);
                      setSelectedIndex(index);
                    }}
                    className="bg-[#FAF9F6] rounded-2xl p-4 border border-stone-100/50 relative cursor-pointer"
                  >
                    <div
                      className="text-[11px] text-stone-500 italic pr-6 outline-none leading-relaxed"
                      contentEditable={!isLocked}
                      suppressContentEditableWarning
                      onBlur={(e) =>
                        updateContent(
                          activeDay,
                          "spots",
                          index,
                          "note",
                          e.target.innerText
                        )
                      }
                    >
                      {renderTextWithLinks(item.note)}
                    </div>
                    <Info
                      size={14}
                      className="absolute top-4 right-4 text-stone-200"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* 交通卡片 */}
            {item.transportAfter && (
              <div className="flex gap-4 ml-5">
                <div className="w-[2px] border-l-2 border-dashed border-stone-300 h-20 ml-[-1px]"></div>
                <div className="flex-grow ml-2 mr-6 my-3 bg-white/40 rounded-full py-2 px-5 border border-stone-200/60 shadow-sm flex items-center justify-between">
                  <div className="flex items-center gap-3 text-[10px] font-black text-stone-700">
                    <div className="bg-stone-800 p-1.5 rounded-full text-white">
                      {item.transportAfter.type === "train" ? (
                        <Train size={12} />
                      ) : (
                        <Bus size={12} />
                      )}
                    </div>
                    <span
                      contentEditable={!isLocked}
                      suppressContentEditableWarning
                    >
                      {item.transportAfter.line}
                    </span>
                    <span className="text-stone-400 font-normal">
                      {item.transportAfter.duration}
                    </span>
                  </div>
                  <Navigation size={12} className="text-stone-300" />
                </div>
              </div>
            )}
          </div>
        ))}
      </main>

      {/* 詳細視窗 */}
      {selectedSpot && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
          <div
            className="absolute inset-0 bg-stone-900/60 backdrop-blur-md"
            onClick={() => setSelectedSpot(null)}
          ></div>
          <div className="relative bg-white w-full max-w-sm rounded-[3rem] p-8 shadow-2xl">
            <div className="flex justify-between items-start mb-6">
              <h2 className="text-2xl font-black text-stone-800">
                {selectedSpot.title}
              </h2>
              <button
                onClick={() => setSelectedSpot(null)}
                className="p-2 bg-stone-100 rounded-full"
              >
                <X size={20} />
              </button>
            </div>

            <div
              className="bg-stone-50 p-6 rounded-[2rem] border border-stone-100 text-[13px] text-stone-600 leading-relaxed italic outline-none min-h-[120px]"
              contentEditable={!isLocked}
              suppressContentEditableWarning
              onBlur={(e) =>
                selectedIndex !== null &&
                updateContent(
                  activeDay,
                  "spots",
                  selectedIndex,
                  "detail",
                  e.target.innerText
                )
              }
            >
              {renderTextWithLinks(selectedSpot.detail)}
            </div>

            {selectedSpot.imageUrl && (
              <div className="mb-4 overflow-hidden rounded-[2rem] border border-stone-200 bg-stone-50 shadow-sm">
                <img
                  src={selectedSpot.imageUrl}
                  alt={selectedSpot.title}
                  className="w-full h-44 object-cover"
                />
              </div>
            )}
            {isLocked && selectedSpot.link && (
              <a
                href={selectedSpot.link}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full mt-2 bg-blue-500 text-white py-4 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2"
              >
                <Navigation size={14} /> Open in Google Maps
              </a>
            )}
            <button
              onClick={() => setSelectedSpot(null)}
              className="w-full mt-4 bg-stone-800 text-white py-4 rounded-2xl font-black text-xs uppercase tracking-widest"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default TravelPlanner;
