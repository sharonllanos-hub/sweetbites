import logo from '../../assets/lOGOSWEETBITES.png'; 
import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Menu,
  X,
  User,
  BookOpen,
  PlusCircle,
  Settings,
  LogOut,
  Heart,
  ChevronDown
} from 'lucide-react'
import { useAuth } from '@context/AuthContext'
import { cn } from '@utils/cn'
import NotificationBell from './NotificationBell'

const navLinks = [
  { href: '/', label: 'Inicio' },
  { href: '/recipes', label: 'Recetas' },
]

const Navbar = () => {
  const { user, isAuthenticated, isAdmin, logout } = useAuth()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const location = useLocation()

  const getInitials = (name) => {
    if (!name) return 'U'
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  const handleLogout = () => {
    logout()
    setMobileMenuOpen(false)
    setUserMenuOpen(false)
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b border-white/40 bg-white/60 backdrop-blur-md shadow-subtle">
      <nav className="container mx-auto flex h-16 items-center justify-between px-4">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2">
          {/* Aquí cambiamos el <span> con el emoji por la etiqueta <img> */}
          <img src={logo} alt="SweetBites Logo" className="h-8 w-auto object-contain" />
          
          <span className="text-xl font-bold text-neutral-gray-800">SweetBites</span>
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden items-center gap-8 md:flex">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              to={link.href}
              className={cn(
                'text-sm font-medium transition-colors hover:text-primary',
                location.pathname === link.href
                  ? 'text-primary'
                  : 'text-neutral-gray-600'
              )}
            >
              {link.label}
            </Link>
          ))}
          {isAuthenticated() && (
            <Link
              to="/user/favorites"
              className={cn(
                'text-sm font-medium transition-colors hover:text-primary',
                location.pathname === '/user/favorites'
                  ? 'text-primary'
                  : 'text-neutral-gray-600'
              )}
            >
              Favoritos
            </Link>
          )}
        </div>

        {/* Desktop Auth/User Section */}
        <div className="hidden items-center gap-4 md:flex">
          {isAuthenticated() ? (
            <>
              <NotificationBell />
              <div className="relative">
              <button
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="flex items-center gap-2 rounded-full bg-primary/10 py-1.5 pl-1.5 pr-3 transition-colors hover:bg-primary/20"
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-primary to-secondary text-sm font-semibold text-white">
                  {getInitials(user?.nombre)}
                </div>
                <ChevronDown
                  className={cn(
                    'h-4 w-4 text-neutral-gray-800 transition-transform',
                    userMenuOpen && 'rotate-180'
                  )}
                />
              </button>

              <AnimatePresence>
                {userMenuOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className="absolute right-0 mt-2 w-56 rounded-2xl border border-white/40 glass p-2 shadow-glass"
                  >
                    <div className="border-b border-neutral-gray-200 px-3 py-2">
                      <p className="font-medium text-neutral-gray-800">{user?.nombre}</p>
                      <p className="text-xs text-neutral-gray-500">{user?.email}</p>
                    </div>
                    <div className="py-1">
                      <Link
                        to="/user/profile"
                        onClick={() => setUserMenuOpen(false)}
                        className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-neutral-gray-700 transition-colors hover:bg-neutral-gray-100"
                      >
                        <User className="h-4 w-4" />
                        Mi Perfil
                      </Link>
                      <Link
                        to="/user/my-recipes"
                        onClick={() => setUserMenuOpen(false)}
                        className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-neutral-gray-700 transition-colors hover:bg-neutral-gray-100"
                      >
                        <BookOpen className="h-4 w-4" />
                        Mis Recetas
                      </Link>
                      <Link
                        to="/user/create-recipe"
                        onClick={() => setUserMenuOpen(false)}
                        className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-neutral-gray-700 transition-colors hover:bg-neutral-gray-100"
                      >
                        <PlusCircle className="h-4 w-4" />
                        Crear Receta
                      </Link>
                      {isAdmin() && (
                        <>
                          <div className="my-1 border-t border-neutral-gray-200" />
                          <Link
                            to="/admin"
                            onClick={() => setUserMenuOpen(false)}
                            className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-neutral-gray-700 transition-colors hover:bg-neutral-gray-100"
                          >
                            <Settings className="h-4 w-4" />
                            Panel Admin
                          </Link>
                        </>
                      )}
                      <div className="my-1 border-t border-neutral-gray-200" />
                      <button
                        onClick={handleLogout}
                        className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-error transition-colors hover:bg-error/10"
                      >
                        <LogOut className="h-4 w-4" />
                        Cerrar Sesión
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            </>
          ) : (
            <>
              <Link to="/auth/login">
                <button className="text-sm font-medium text-neutral-gray-700 transition-colors hover:text-primary">
                  Iniciar Sesión
                </button>
              </Link>
              <Link to="/auth/register">
                <button className="rounded-full bg-primary px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-primary-dark">
                  Registrarse
                </button>
              </Link>
            </>
          )}
        </div>

        {/* Mobile Menu Button */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="rounded-lg p-2 text-neutral-gray-800 hover:bg-neutral-gray-100 md:hidden"
        >
          {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </nav>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="border-t border-neutral-gray-200 md:hidden"
          >
            <div className="container mx-auto space-y-1 px-4 py-4">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  to={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={cn(
                    'block rounded-lg px-4 py-3 text-base font-medium transition-colors',
                    location.pathname === link.href
                      ? 'bg-primary/10 text-primary'
                      : 'text-neutral-gray-700 hover:bg-neutral-gray-100'
                  )}
                >
                  {link.label}
                </Link>
              ))}
              {isAuthenticated() && (
                <>
                  <Link
                    to="/user/favorites"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-3 rounded-lg px-4 py-3 text-base font-medium text-neutral-gray-700 transition-colors hover:bg-neutral-gray-100"
                  >
                    <Heart className="h-5 w-5" />
                    Favoritos
                  </Link>
                  <Link
                    to="/user/profile"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-3 rounded-lg px-4 py-3 text-base font-medium text-neutral-gray-700 transition-colors hover:bg-neutral-gray-100"
                  >
                    <User className="h-5 w-5" />
                    Mi Perfil
                  </Link>
                  <Link
                    to="/user/create-recipe"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-3 rounded-lg px-4 py-3 text-base font-medium text-neutral-gray-700 transition-colors hover:bg-neutral-gray-100"
                  >
                    <PlusCircle className="h-5 w-5" />
                    Crear Receta
                  </Link>
                  {isAdmin() && (
                    <Link
                      to="/admin"
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex items-center gap-3 rounded-lg px-4 py-3 text-base font-medium text-neutral-gray-700 transition-colors hover:bg-neutral-gray-100"
                    >
                      <Settings className="h-5 w-5" />
                      Panel Admin
                    </Link>
                  )}
                  <button
                    onClick={handleLogout}
                    className="flex w-full items-center gap-3 rounded-lg px-4 py-3 text-base font-medium text-error transition-colors hover:bg-error/10"
                  >
                    <LogOut className="h-5 w-5" />
                    Cerrar Sesión
                  </button>
                </>
              )}
              {!isAuthenticated() && (
                <div className="flex gap-3 pt-2">
                  <Link to="/auth/login" className="flex-1" onClick={() => setMobileMenuOpen(false)}>
                    <button className="w-full rounded-lg border border-primary px-4 py-2 text-sm font-medium text-primary transition-colors hover:bg-primary hover:text-white">
                      Iniciar Sesión
                    </button>
                  </Link>
                  <Link to="/auth/register" className="flex-1" onClick={() => setMobileMenuOpen(false)}>
                    <button className="w-full rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-primary-dark">
                      Registrarse
                    </button>
                  </Link>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  )
}

export default Navbar
