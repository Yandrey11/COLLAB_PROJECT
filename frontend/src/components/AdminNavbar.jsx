export default function AdminNavbar({ admin, handleLogout }) {
  return (
    <header className="bg-gradient-to-r from-purple-600 to-indigo-700 text-white shadow-lg flex justify-between items-center px-8 py-4">
      <h1 className="text-2xl font-bold tracking-wide">Guidance System Admin</h1>
      <div className="flex items-center gap-4">
        {admin && (
          <div className="text-right">
            <p className="font-semibold">{admin.name}</p>
            <p className="text-sm opacity-80">{admin.email}</p>
          </div>
        )}
        <button
          onClick={handleLogout}
          className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg font-medium transition-all"
        >
          Logout
        </button>
      </div>
    </header>
  );
}
