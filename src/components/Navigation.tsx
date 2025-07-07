
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuth } from '@/hooks/useAuth';
import { 
  BarChart, 
  CreditCard, 
  TrendingUp, 
  DollarSign,
  Menu,
  X,
  Settings,
  User
} from 'lucide-react';

interface NavigationProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export const Navigation = ({ activeTab, onTabChange }: NavigationProps) => {
  const { user } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: BarChart },
    { id: 'contas', label: 'Contas', icon: CreditCard },
    { id: 'receitas', label: 'Receitas', icon: DollarSign },
    { id: 'investimentos', label: 'Investimentos', icon: TrendingUp },
  ];

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const handleSettingsClick = () => {
    window.location.href = '/settings';
  };

  return (
    <>
      {/* Desktop Navigation */}
      <nav className="hidden md:flex bg-white/80 backdrop-blur-lg border-b border-gray-200/50 px-6 py-4 shadow-lg">
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center space-x-6">
            <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              My Money
            </h1>
            <div className="flex space-x-2">
              {tabs.map(tab => {
                const Icon = tab.icon;
                return (
                  <Button
                    key={tab.id}
                    variant={activeTab === tab.id ? 'default' : 'ghost'}
                    onClick={() => onTabChange(tab.id)}
                    className={`flex items-center gap-2 transition-all duration-300 ${
                      activeTab === tab.id 
                        ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg transform scale-105' 
                        : 'hover:bg-purple-50 hover:text-purple-700 hover:shadow-md hover:transform hover:scale-105'
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    {tab.label}
                  </Button>
                );
              })}
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={handleSettingsClick}
              className="hover:bg-purple-50 hover:text-purple-700"
            >
              <Settings className="h-5 w-5" />
            </Button>
            <Avatar className="h-8 w-8 cursor-pointer" onClick={handleSettingsClick}>
              <AvatarFallback className="bg-gradient-to-r from-purple-500 to-pink-500 text-white text-sm">
                {user?.email?.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
          </div>
        </div>
      </nav>

      {/* Mobile Navigation */}
      <nav className="md:hidden bg-white/80 backdrop-blur-lg border-b border-gray-200/50 shadow-lg">
        <div className="flex justify-between items-center px-4 py-3">
          <h1 className="text-xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
            My Money
          </h1>
          <div className="flex items-center space-x-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={handleSettingsClick}
              className="hover:bg-purple-50 hover:text-purple-700"
            >
              <Settings className="h-5 w-5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleMobileMenu}
              className="hover:bg-purple-50 hover:text-purple-700 transition-all duration-200"
            >
              {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </Button>
          </div>
        </div>
        
        {isMobileMenuOpen && (
          <div className="border-t border-gray-200/50 bg-white/90 backdrop-blur-lg">
            <div className="px-4 py-2 space-y-1">
              {tabs.map(tab => {
                const Icon = tab.icon;
                return (
                  <Button
                    key={tab.id}
                    variant={activeTab === tab.id ? 'default' : 'ghost'}
                    onClick={() => {
                      onTabChange(tab.id);
                      setIsMobileMenuOpen(false);
                    }}
                    className={`w-full justify-start gap-2 transition-all duration-300 ${
                      activeTab === tab.id 
                        ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg' 
                        : 'hover:bg-purple-50 hover:text-purple-700 hover:shadow-md'
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    {tab.label}
                  </Button>
                );
              })}
            </div>
          </div>
        )}
      </nav>
    </>
  );
};
