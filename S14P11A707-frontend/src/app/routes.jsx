import React from 'react'
import { Route, Switch } from 'wouter'
import { ROUTES } from './routePaths'

// Pages
import Home from '../pages/Home'
import Scenarios from '../pages/Scenarios'
import ScenarioDetail from '../pages/ScenarioDetail'
import CreateScenario from '../pages/CreateScenario'
import Ranking from '../pages/Ranking'
import Board from '../pages/Board'
import MyBookshelf from '../pages/MyBookshelf'
import GamePlay from '../pages/GamePlay'
import GameRoom from '../pages/GameRoom'
import CoopLobby from '../pages/CoopLobby'
import CoopGame from '../pages/CoopGame'
import Submit from '../pages/Submit'
import NotFound from '../pages/NotFound'
import Profile from '../pages/Profile'
import Tutorial from '../pages/Tutorial'

export function AppRoutes() {
  return (
    <Switch>
      <Route path={ROUTES.HOME} component={Home} />
      <Route path={ROUTES.TUTORIAL} component={Tutorial} />
      <Route path={ROUTES.SCENARIOS} component={Scenarios} />
      <Route path={ROUTES.SCENARIO_DETAIL} component={ScenarioDetail} />
      <Route path={ROUTES.CREATE_SCENARIO} component={CreateScenario} />
      <Route path={ROUTES.RANKING} component={Ranking} />
      <Route path={ROUTES.PROFILE} component={Profile} />
      <Route path={ROUTES.BOARD} component={Board} />
      <Route path={ROUTES.MY_BOOKSHELF} component={MyBookshelf} />
      <Route path={ROUTES.GAME} component={GamePlay} />
      <Route path={ROUTES.ROOM_SOLO} component={GameRoom} />
      <Route path={ROUTES.ROOM_MULTI} component={GameRoom} />
      <Route path={ROUTES.COOP_LOBBY} component={CoopLobby} />
      <Route path={ROUTES.COOP_GAME} component={CoopGame} />
      <Route path={ROUTES.SUBMIT} component={Submit} />
      <Route path={ROUTES.NOT_FOUND} component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  )
}
