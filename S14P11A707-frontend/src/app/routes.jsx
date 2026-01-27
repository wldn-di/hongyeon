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
      <Route path={ROUTES.HOME} component={Home} />
      <Route path={ROUTES.TUTORIAL} component={Tutorial} />
      <Route path={ROUTES.SCENARIOS} component={Scenarios} />
      <Route path={ROUTES.SCENARIO_DETAIL} component={ScenarioDetail} />
      <Route path={ROUTES.CREATE_SCENARIO} component={CreateScenario} />
      <Route path={ROUTES.RANKING} component={Ranking} />
      <Route path={ROUTES.PROFILE} component={Profile} />
      <Route path={ROUTES.BOARD} component={Board} />
      <Route path={ROUTES.BOARD_SESSION} component={BoardSession} />
      <Route path={ROUTES.MY_BOOKSHELF} component={MyBookshelf} />
      <Route path={ROUTES.GAME} component={GameRoom} />
      <Route path={ROUTES.SUBMIT} component={Submit} />
      <Route path={ROUTES.SUBMIT_SESSION} component={SubmitSession} />
      <Route path={ROUTES.NOT_FOUND} component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  )
}
