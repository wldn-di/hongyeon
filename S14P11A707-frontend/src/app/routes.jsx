import React from 'react'
import { Route, Switch } from 'wouter'
import { ROUTES } from './routePaths'
import ProtectedRoute from '../components/ProtectedRoute'

// Pages
import Home from '../pages/Home'
import Scenarios from '../pages/Scenarios'
import ScenarioDetail from '../pages/ScenarioDetail'
import CreateScenario from '../pages/CreateScenario'
import Ranking from '../pages/Ranking'
import Board from '../pages/Board'
import BoardSession from '../pages/BoardSession'
import MyBookshelf from '../pages/MyBookshelf'
import GameRoom from '../pages/GameRoom'
import Submit from '../pages/Submit'
import SubmitSession from '../pages/SubmitSession'
import NotFound from '../pages/NotFound'
import Profile from '../pages/Profile'
import Tutorial from '../pages/Tutorial'

export function AppRoutes() {
  return (
    <Switch>
      {/* 공개 라우트 */}
      <Route path={ROUTES.HOME} component={Home} />
      <Route path={ROUTES.TUTORIAL} component={Tutorial} />
      <Route path={ROUTES.SCENARIOS} component={Scenarios} />
      <Route path={ROUTES.SCENARIO_DETAIL} component={ScenarioDetail} />
      <Route path={ROUTES.RANKING} component={Ranking} />
      <Route path={ROUTES.PROFILE} component={Profile} />
      <Route path={ROUTES.BOARD} component={Board} />
      <Route path={ROUTES.NOT_FOUND} component={NotFound} />

      {/* 보호된 라우트 (인증 필요) */}
      <Route path={ROUTES.CREATE_SCENARIO}>
        {(params) => <ProtectedRoute component={CreateScenario} {...params} />}
      </Route>
      <Route path={ROUTES.MY_BOOKSHELF}>
        {(params) => <ProtectedRoute component={MyBookshelf} {...params} />}
      </Route>
      <Route path={ROUTES.BOARD_SESSION}>
        {(params) => <ProtectedRoute component={BoardSession} {...params} />}
      </Route>
      <Route path={ROUTES.GAME}>
        {(params) => <ProtectedRoute component={GameRoom} {...params} />}
      </Route>
      <Route path={ROUTES.GAME_SOLO}>
        {(params) => <ProtectedRoute component={GameRoom} {...params} />}
      </Route>
      <Route path={ROUTES.GAME_RESUME}>
        {(params) => <ProtectedRoute component={GameRoom} {...params} />}
      </Route>
      <Route path={ROUTES.SUBMIT}>
        {(params) => <ProtectedRoute component={Submit} {...params} />}
      </Route>
      <Route path={ROUTES.SUBMIT_SESSION}>
        {(params) => <ProtectedRoute component={SubmitSession} {...params} />}
      </Route>

      {/* 404 */}
      <Route component={NotFound} />
    </Switch>
  )
}
