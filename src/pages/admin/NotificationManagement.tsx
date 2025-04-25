import axios from "axios";
import React, { useEffect, useState } from "react";
import Swal from "sweetalert2";
import DashboardSidebar from "../../components/DashboardSidebar";

interface Notification {
  notification_id: number;
  name: string;
  message: string;
  is_read: number;
  created_at: string;
}

const NotificationManagement: React.FC = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const API_URL =
    "https://agrigenapi.sarangartstudio.com/adminController/notificationController.php";

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      const response = await axios.get(API_URL);
      console.log(response.data); // Check the response data in console

      // Ensure the response is an array
      const notificationsData = Array.isArray(response.data)
        ? response.data
        : [];
      setNotifications(notificationsData);
    } catch (error) {
      Swal.fire("Error", "Failed to fetch notifications.", "error");
    }
  };

  const handleDelete = async (id: number) => {
    const confirm = await Swal.fire({
      title: "Are you sure?",
      text: "You won't be able to revert this!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Yes, delete it!",
    });

    if (confirm.isConfirmed) {
      try {
        await axios.delete(`${API_URL}?notification_id=${id}`);
        Swal.fire("Deleted!", "Notification deleted.", "success");
        fetchNotifications();
      } catch (error) {
        Swal.fire("Error", "Failed to delete notification.", "error");
      }
    }
  };

  const handleMarkAsRead = async (id: number, isRead: number) => {
    const newIsRead = isRead === 1 ? 0 : 1;

    try {
      await axios.put(API_URL, {
        notification_id: id,
        is_read: newIsRead,
      });
      Swal.fire("Success", "Notification status updated.", "success");
      fetchNotifications();
    } catch (error) {
      Swal.fire("Error", "Failed to update notification status.", "error");
    }
  };

  return (
    <div className="flex min-h-screen bg-gray-100">
      <DashboardSidebar type="admin" />
      <div className="flex-1 ml-[280px] p-6">
        <h1 className="text-3xl font-bold mb-4">Notification Management</h1>

        {/* Notification List */}
        <div className="bg-white p-4 shadow rounded">
          <h2 className="text-xl font-bold mb-2">Notifications</h2>
          <table className="w-full border">
            <thead className="bg-gray-200">
              <tr>
                <th className="border p-2">ID</th>
                <th className="border p-2">Name</th>
                <th className="border p-2">Message</th>
                <th className="border p-2">Date</th>
                <th className="border p-2">Status</th>
                <th className="border p-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {notifications.length > 0 ? (
                notifications.map((notification) => (
                  <tr key={notification.notification_id}>
                    <td className="border p-2">
                      {notification.notification_id}
                    </td>
                    <td className="border p-2">{notification.name}</td>
                    <td className="border p-2">{notification.message}</td>
                    <td className="border p-2">{notification.created_at}</td>
                    <td className="border p-2">
                      <button
                        onClick={() =>
                          handleMarkAsRead(
                            notification.notification_id,
                            notification.is_read
                          )
                        }
                        className={`px-2 py-1 rounded ${
                          notification.is_read === 1
                            ? "bg-green-500"
                            : "bg-gray-500"
                        } text-white`}
                      >
                        {notification.is_read === 1
                          ? "Mark as Unread"
                          : "Mark as Read"}
                      </button>
                    </td>
                    <td className="border p-2">
                      <button
                        onClick={() =>
                          handleDelete(notification.notification_id)
                        }
                        className="bg-red-500 text-white px-2 py-1 rounded"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan={6}
                    className="border p-2 text-center text-gray-500"
                  >
                    No notifications available
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default NotificationManagement;
