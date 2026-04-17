import { useEffect, useMemo, useRef, useState } from "react";
import {
  Avatar,
  Badge,
  Button,
  Empty,
  Input,
  List,
  Popconfirm,
  Space,
  Spin,
  Tag,
  Typography,
  message,
} from "antd";
import {
  CloudUploadOutlined,
  PaperClipOutlined,
  SearchOutlined,
  SendOutlined,
  UserOutlined,
} from "@ant-design/icons";
import { io, type Socket } from "socket.io-client";
import type { ArgsProps } from "antd/es/message/interface";
import Header from "../components/Header";
import { RiWechatLine } from "react-icons/ri";

const { Text } = Typography;

interface SocialUser {
  _id: string;
  firstName: string;
  lastName: string;
  fullName: string;
  email: string;
  role: string;
  idUser: string;
  idStudent?: string;
  idTeacher?: string;
  className?: string;
  isOnline: boolean;
  lastSeenAt?: string;
  avatarUrl: string;
}

interface MessageAttachment {
  url: string;
  publicId: string;
  fileName: string;
  mimeType: string;
  resourceType: string;
  size: number;
}

interface SocialMessage {
  _id: string;
  sender: {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
    avatar?: string;
    avatarUrl?: string;
    role: string;
    idUser: string;
  };
  receiver: {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
    avatar?: string;
    avatarUrl?: string;
    role: string;
    idUser: string;
  };
  text?: string;
  attachments: MessageAttachment[];
  delivered: boolean;
  deliveredAt?: string;
  seen: boolean;
  seenAt?: string;
  recalled: boolean;
  recalledAt?: string;
  createdAt: string;
}

interface MessageStatusPayload {
  fromUserId: string;
  status: "delivered" | "read";
  messageIds: string[];
}

const roleLabel: Record<string, string> = {
  admin: "Quản trị viên",
  teacher: "Giáo viên",
  student: "Học sinh",
  user: "Cờ đỏ",
};

const formatLastSeen = (isOnline: boolean, lastSeenAt?: string) => {
  if (isOnline) return "Đang online";
  if (!lastSeenAt) return "Offline";

  const diffMs = Date.now() - new Date(lastSeenAt).getTime();
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return "Vừa truy cập";
  if (diffMin < 60) return `Online ${diffMin} phút trước`;

  const diffHour = Math.floor(diffMin / 60);
  if (diffHour < 24) return `Online ${diffHour} giờ trước`;

  const diffDay = Math.floor(diffHour / 24);
  return `Online ${diffDay} ngày trước`;
};

const formatTime = (date: string) => {
  const d = new Date(date);
  return d.toLocaleTimeString("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
  });
};

const getMyMessageStatusLabel = (message: SocialMessage) => {
  if (message.recalled) return "Đã thu hồi";
  if (message.seen) return "Đã đọc";
  if (message.delivered) return "Đã nhận";
  return "Đã gửi";
};

const getUndoMessageKey = (messageId: string) => `social-recall-undo-${messageId}`;

const SocialPage = () => {
  const [messageApi, contextHolder] = message.useMessage();
  const [users, setUsers] = useState<SocialUser[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [selectedUser, setSelectedUser] = useState<SocialUser | null>(null);
  const [messages, setMessages] = useState<SocialMessage[]>([]);
  const [textMessage, setTextMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [myId, setMyId] = useState<string>("");
  const socketRef = useRef<Socket | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const messageEndRef = useRef<HTMLDivElement | null>(null);

  const updateMessageInState = (payload: SocialMessage) => {
    setMessages((prev) => prev.map((msg) => (msg._id === payload._id ? payload : msg)));
  };

  const closeUndoRecallNotice = (messageId: string) => {
    messageApi.destroy(getUndoMessageKey(messageId));
  };

  const showUndoRecallNotice = (messageId: string) => {
    const key = getUndoMessageKey(messageId);

    const config: ArgsProps = {
      key,
      duration: 5,
      content: (
        <div className="flex items-center gap-2">
          <span>Tin nhắn đã được thu hồi</span>
          <Button
            size="small"
            type="link"
            className="!h-auto !p-0"
            onClick={() => {
              void undoRecallMessage(messageId);
            }}
          >
            Hoàn tác
          </Button>
        </div>
      ),
    };

    messageApi.open(config);
  };

  const token = useMemo(() => {
    const raw = localStorage.getItem("userInfo");
    if (!raw) return "";

    try {
      const parsed = JSON.parse(raw);
      setMyId(parsed._id || "");
      return parsed.token || "";
    } catch {
      return "";
    }
  }, []);

  const fetchUsers = async (q = "") => {
    if (!token) return;

    setLoadingUsers(true);
    try {
      const url = new URL(`${import.meta.env.VITE_SERVER_URL}/social/users`);
      if (q.trim()) {
        url.searchParams.set("q", q.trim());
      }

      const res = await fetch(url.toString(), {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        throw new Error("Không tải được danh sách người dùng");
      }

      const data: SocialUser[] = await res.json();
      setUsers(data);

      if (!selectedUser && data.length > 0) {
        setSelectedUser(data[0]);
      }
    } catch (error) {
      console.error(error);
      messageApi.error("Lỗi tải danh sách người dùng");
    } finally {
      setLoadingUsers(false);
    }
  };

  const recallMessage = async (messageId: string) => {
    if (!token) return;

    try {
      const res = await fetch(
        `${import.meta.env.VITE_SERVER_URL}/social/messages/${messageId}/recall`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        },
      );

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.message || "Thu hồi tin nhắn thất bại");
      }

      const payload: SocialMessage = await res.json();
      updateMessageInState(payload);
      showUndoRecallNotice(messageId);
    } catch (error: any) {
      console.error(error);
      messageApi.error(error.message || "Không thể thu hồi tin nhắn");
    }
  };

  const undoRecallMessage = async (messageId: string) => {
    if (!token) return;

    try {
      const res = await fetch(
        `${import.meta.env.VITE_SERVER_URL}/social/messages/${messageId}/undo-recall`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        },
      );

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.message || "Hoàn tác thu hồi thất bại");
      }

      const payload: SocialMessage = await res.json();
      updateMessageInState(payload);
      closeUndoRecallNotice(messageId);
      messageApi.success("Đã hoàn tác thu hồi tin nhắn");
    } catch (error: any) {
      console.error(error);
      messageApi.error(error.message || "Không thể hoàn tác thu hồi");
    }
  };

  const fetchMessages = async (peerId: string) => {
    if (!token || !peerId) return;

    setLoadingMessages(true);
    try {
      const res = await fetch(`${import.meta.env.VITE_SERVER_URL}/social/messages/${peerId}`, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        throw new Error("Không tải được tin nhắn");
      }

      const data: SocialMessage[] = await res.json();
      setMessages(data);
    } catch (error) {
      console.error(error);
      messageApi.error("Lỗi tải lịch sử tin nhắn");
    } finally {
      setLoadingMessages(false);
    }
  };

  useEffect(() => {
    fetchUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  useEffect(() => {
    if (!selectedUser) return;
    fetchMessages(selectedUser._id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedUser?._id, token]);

  useEffect(() => {
    if (!token) return;

    const socket = io(import.meta.env.VITE_SERVER_URL, {
      transports: ["websocket"],
      auth: {
        token,
      },
    });

    socket.on("social:message-recalled", (payload: SocialMessage) => {
      updateMessageInState(payload);

      if (payload.sender._id === myId) {
        showUndoRecallNotice(payload._id);
      }
    });

    socketRef.current = socket;

    socket.on("social:message", (payload: SocialMessage) => {
      const isCurrentConversation =
        payload.sender._id === selectedUser?._id || payload.receiver._id === selectedUser?._id;

      if (isCurrentConversation) {
        setMessages((prev) => {
          const existed = prev.some((msg) => msg._id === payload._id);
          if (existed) return prev;
          return [...prev, payload];
        });

        if (payload.sender._id === selectedUser?._id && payload.receiver._id === myId) {
          fetchMessages(selectedUser._id);
        }
      }

      fetchUsers(searchText);
    });

    socket.on("social:presence", (payload: { userId: string; isOnline: boolean; lastSeenAt: string }) => {
      setUsers((prev) =>
        prev.map((user) =>
          user._id === payload.userId
            ? {
                ...user,
                isOnline: payload.isOnline,
                lastSeenAt: payload.lastSeenAt,
              }
            : user,
        ),
      );
    });

    socket.on("social:message-status", (payload: MessageStatusPayload) => {
      setMessages((prev) =>
        prev.map((messageItem) => {
          if (!payload.messageIds.includes(messageItem._id)) {
            return messageItem;
          }

          if (payload.status === "read") {
            return {
              ...messageItem,
              delivered: true,
              seen: true,
            };
          }

          if (payload.status === "delivered") {
            return {
              ...messageItem,
              delivered: true,
            };
          }

          return messageItem;
        }),
      );
    });

    socket.on("social:message-unrecalled", (payload: SocialMessage) => {
      updateMessageInState(payload);
      closeUndoRecallNotice(payload._id);
    });

    return () => {
      messageApi.destroy();
      socket.disconnect();
      socketRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, selectedUser?._id, searchText]);

  useEffect(() => {
    messageEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const onSearch = (value: string) => {
    setSearchText(value);
    fetchUsers(value);
  };

  const openFilePicker = () => {
    fileInputRef.current?.click();
  };

  const onFilesSelected: React.ChangeEventHandler<HTMLInputElement> = (event) => {
    const files = Array.from(event.target.files || []);
    if (files.length === 0) return;

    setSelectedFiles((prev) => {
      const merged = [...prev, ...files].slice(0, 5);
      return merged;
    });

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const removeFile = (index: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const sendMessage = async () => {
    if (!selectedUser || !token) return;

    const text = textMessage.trim();
    if (!text && selectedFiles.length === 0) {
      messageApi.warning("Vui lòng nhập tin nhắn hoặc chọn tệp");
      return;
    }

    setSending(true);
    try {
      const formData = new FormData();
      formData.append("toUserId", selectedUser._id);
      formData.append("text", text);
      selectedFiles.forEach((file) => formData.append("attachments", file));

      const res = await fetch(`${import.meta.env.VITE_SERVER_URL}/social/messages`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.message || "Gửi tin nhắn thất bại");
      }

      const payload: SocialMessage = await res.json();
      setMessages((prev) => {
        const existed = prev.some((msg) => msg._id === payload._id);
        if (existed) return prev;
        return [...prev, payload];
      });

      setTextMessage("");
      setSelectedFiles([]);
      fetchUsers(searchText);
    } catch (error: any) {
      console.error(error);
      messageApi.error(error.message || "Không thể gửi tin nhắn");
    } finally {
      setSending(false);
    }
  };

  return (
    <div>
      {contextHolder}
      <Header
        title="Mạng xã hội nội bộ"
        subtitle="Tra cứu người dùng, trạng thái online/offline và nhắn tin realtime"
        logo={RiWechatLine}
      />

      <div className="grid h-[calc(100vh-210px)] grid-cols-1 gap-4 p-4 md:grid-cols-[360px_1fr]">
        <div className="flex h-full flex-col overflow-hidden rounded-xl border border-[var(--border-color)] bg-[var(--surface-1)]">
          <div className="border-b border-[var(--border-color)] p-3">
            <Input
              placeholder="Tìm theo tên, lớp, mã HS/GV, email..."
              prefix={<SearchOutlined />}
              value={searchText}
              onChange={(e) => onSearch(e.target.value)}
              allowClear
            />
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto p-2">
            {loadingUsers ? (
              <div className="mt-6 flex justify-center">
                <Spin />
              </div>
            ) : users.length === 0 ? (
              <Empty description="Không có người dùng phù hợp" />
            ) : (
              <List
                dataSource={users}
                renderItem={(user) => {
                  const active = selectedUser?._id === user._id;

                  return (
                    <List.Item
                      className={`cursor-pointer rounded-lg border p-3 transition ${
                        active
                          ? "border-[var(--primary-color)] bg-[var(--surface-2)]"
                          : "border-transparent hover:border-[var(--border-color)]"
                      }`}
                      onClick={() => setSelectedUser(user)}
                    >
                      <Space align="start" className="w-full">
                        <Badge color={user.isOnline ? "#52c41a" : "#8c8c8c"} dot>
                          <Avatar src={user.avatarUrl} icon={<UserOutlined />} />
                        </Badge>
                        <div className="min-w-0 flex-1">
                          <div className="truncate font-semibold text-[var(--text-color)]">
                            {user.fullName}
                          </div>
                          <div className="truncate text-xs text-[var(--text-muted)]">
                            {user.email}
                          </div>
                          <div className="mt-1 flex flex-wrap gap-1">
                            <Tag color="blue">{roleLabel[user.role] || user.role}</Tag>
                            {user.className && user.className !== "---" && (
                              <Tag color="cyan">{user.className}</Tag>
                            )}
                          </div>
                          <Text type="secondary" className="!text-xs">
                            {formatLastSeen(user.isOnline, user.lastSeenAt)}
                          </Text>
                        </div>
                      </Space>
                    </List.Item>
                  );
                }}
              />
            )}
          </div>
        </div>

        <div className="flex h-full flex-col overflow-hidden rounded-xl border border-[var(--border-color)] bg-[var(--surface-1)]">
          {selectedUser ? (
            <>
              <div className="flex items-center justify-between border-b border-[var(--border-color)] p-3">
                <Space>
                  <Badge color={selectedUser.isOnline ? "#52c41a" : "#8c8c8c"} dot>
                    <Avatar src={selectedUser.avatarUrl} icon={<UserOutlined />} />
                  </Badge>
                  <div>
                    <div className="font-semibold text-[var(--text-color)]">{selectedUser.fullName}</div>
                    <Text type="secondary" className="!text-xs">
                      {formatLastSeen(selectedUser.isOnline, selectedUser.lastSeenAt)}
                    </Text>
                  </div>
                </Space>
              </div>

              <div className="min-h-0 flex-1 overflow-y-auto p-4">
                {loadingMessages ? (
                  <div className="mt-8 flex justify-center">
                    <Spin />
                  </div>
                ) : messages.length === 0 ? (
                  <Empty description="Chưa có tin nhắn" />
                ) : (
                  <div className="space-y-3">
                    {messages.map((msg) => {
                      const mine = msg.sender._id === myId;
                      return (
                        <div key={msg._id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                          <div
                            className={`max-w-[80%] rounded-xl px-3 py-2 ${
                              mine
                                ? "bg-[var(--primary-color)] text-white"
                                : "bg-[var(--surface-2)] text-[var(--text-color)]"
                            }`}
                          >
                            {msg.recalled ? (
                              <div className="text-sm italic opacity-80">Tin nhắn đã được thu hồi</div>
                            ) : (
                              <>
                                {msg.text && <div className="whitespace-pre-wrap text-sm">{msg.text}</div>}

                                {msg.attachments?.length > 0 && (
                                  <div className="mt-2 space-y-1">
                                    {msg.attachments.map((att) => {
                                      const isImage = att.mimeType?.startsWith("image/");

                                      return (
                                        <div key={att.publicId}>
                                          {isImage ? (
                                            <a href={att.url} target="_blank" rel="noreferrer">
                                              <img
                                                src={att.url}
                                                alt={att.fileName}
                                                className="max-h-40 rounded border border-[var(--border-color)]"
                                              />
                                            </a>
                                          ) : (
                                            <a
                                              href={att.url}
                                              target="_blank"
                                              rel="noreferrer"
                                              className={`inline-flex items-center gap-2 rounded px-2 py-1 text-xs ${
                                                mine ? "bg-white/20 text-white" : "bg-[var(--surface-3)]"
                                              }`}
                                            >
                                              <PaperClipOutlined /> {att.fileName}
                                            </a>
                                          )}
                                        </div>
                                      );
                                    })}
                                  </div>
                                )}
                              </>
                            )}

                            <div className="mt-1 flex items-center justify-end gap-2">
                              {mine && !msg.recalled && (
                                <Popconfirm
                                  title="Thu hồi tin nhắn"
                                  description="Bạn muốn thu hồi tin nhắn này?"
                                  okText="Thu hồi"
                                  cancelText="Hủy"
                                  onConfirm={() => recallMessage(msg._id)}
                                >
                                  <Button size="small" type="link" className="!h-auto !p-0 !text-white/80">
                                    Thu hồi
                                  </Button>
                                </Popconfirm>
                              )}

                              <div className={`text-right text-[11px] ${mine ? "text-white/80" : "text-[var(--text-muted)]"}`}>
                                {formatTime(msg.createdAt)}
                                {mine ? ` • ${getMyMessageStatusLabel(msg)}` : ""}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                    <div ref={messageEndRef} />
                  </div>
                )}
              </div>

              <div className="border-t border-[var(--border-color)] p-3">
                {selectedFiles.length > 0 && (
                  <div className="mb-2 flex flex-wrap gap-2">
                    {selectedFiles.map((file, index) => (
                      <Tag
                        key={`${file.name}-${index}`}
                        closable
                        onClose={() => removeFile(index)}
                        color="processing"
                      >
                        {file.name}
                      </Tag>
                    ))}
                  </div>
                )}

                <div className="flex gap-2">
                  <input
                    ref={fileInputRef}
                    type="file"
                    className="hidden"
                    multiple
                    onChange={onFilesSelected}
                    accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.txt"
                  />
                  <Button icon={<CloudUploadOutlined />} onClick={openFilePicker}>
                    Tệp
                  </Button>
                  <Input.TextArea
                    value={textMessage}
                    onChange={(e) => setTextMessage(e.target.value)}
                    autoSize={{ minRows: 1, maxRows: 4 }}
                    placeholder="Nhập tin nhắn..."
                    onPressEnter={(e) => {
                      if (!e.shiftKey) {
                        e.preventDefault();
                        sendMessage();
                      }
                    }}
                  />
                  <Button
                    type="primary"
                    icon={<SendOutlined />}
                    loading={sending}
                    onClick={sendMessage}
                    style={{ backgroundColor: "var(--primary-color)" }}
                  >
                    Gửi
                  </Button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex h-full items-center justify-center">
              <Empty description="Chọn một người dùng để bắt đầu trò chuyện" />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SocialPage;
