import React from 'react';
import { ScreenType } from '../components/Header';
import { UserProfile, MyBizContext } from '../services/api';
import { MyBizDashboardPage } from './MyBizDashboardPage';

interface BusinessDashboardPageProps {
  onNavigate: (screen: ScreenType) => void;
  user: UserProfile | null;
  bizContext: MyBizContext | null;
  onOpenAuth: () => void;
  initialTab?: string;
}

export const BusinessDashboardPage: React.FC<BusinessDashboardPageProps> = (props) => {
  return <MyBizDashboardPage {...props} />;
};

