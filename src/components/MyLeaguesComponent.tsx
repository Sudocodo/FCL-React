import {useState, useEffect} from "react";
import { Link, Navigate } from "react-router-dom";
import { Principal } from "../models/Principal";

import { reqParamQuery } from "../remote/request-param-data";

export default function MyLeaguesComponent({currentUser}:any, {setLeague}:any) {
    let [leagueList, updateLeagueList] = useState([]);

    function updateCurrLeague(e:any){
        console.log( e.target.innerText);
        setLeague(e.target.innerText);
    }
    
    useEffect( () => {
        reqParamQuery("/league/user=", currentUser.id).then((leagues) => {
            if (leagueList.length == 0) updateLeagueList(leagues);
        });
    });

    return (<>
        <h1><u>MY LEAGUES</u></h1>
    
        <table className="table table-striped table-bordered">
            <thead>
                <tr>
                    <th>Name</th>
                    <th>Creator</th>
                    <th>Initial Balance</th>
                    <th> Action </th>
                 </tr>
            </thead>
            <tbody>
                {leagueList && leagueList.map(league =>
                    <tr key={league["leagueName"]}>
                        {/* <td><Link to={league['leagueName']} onClick={updateCurrLeague}> {league["leagueName"]}</Link></td> */}
                        <td><Link to={'/leaderboard'} onClick={updateCurrLeague}> {league["leagueName"]}</Link></td>
                        <td>{league["creatorName"]}</td>
                        <td>{league["initialBal"]}</td>
                        <td><Link to={league['leagueName']} onClick={updateCurrLeague}> View </Link></td>
                    </tr>
                    )}
            </tbody>
        </table>
    </>)
}