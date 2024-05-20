let express = require("express");
let path = require("path");
let { open } = require("sqlite");
let sqlite3 = require("sqlite3");

let dbPath = path.join(__dirname, "covid19India.db");
let app = express();
app.use(express.json());
let db = null;

let convertDbObjectToResponseObject = (dbObject) => {
  return {
    stateId: dbObject.state_id,
    stateName: dbObject.state_name,
    population: dbObject.population,
  };
};

let convertDbDictObjectToResponseDictObject = (eachItem) => {
  return {
    districtId: eachItem.district_id,
    districtName: eachItem.district_name,
    stateId: eachItem.state_id,
    cases: eachItem.cases,
    cured: eachItem.cured,
    active: eachItem.active,
    deaths: eachItem.deaths,
  };
};

let conTotalDictsOfStateToResObject = (dbResponse) => {
  return {
    totalCases: dbResponse.total_cases,
    totalCured: dbResponse.total_cured,
    totalActive: dbResponse.total_active,
    totalDeaths: dbResponse.total_deaths,
  };
};

let convertStateNameToResponseObject = (dbResponse) => {
  return {
    stateName: dbResponse.state_name,
  };
};

let initializationDbToServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server is Running at http://localhost:3000/");
    });
  } catch (e) {
    console.log(`Db Error:${e.message}`);
    process.exit(1);
  }
};

initializationDbToServer();

//API-1

app.get("/states/", async (request, response) => {
  let listOfStates = `SELECT * FROM state`;
  let dbResponse = await db.all(listOfStates);
  let responseObject = dbResponse.map((eachItem) =>
    convertDbObjectToResponseObject(eachItem)
  );
  //console.log(responseObject);
  response.send(responseObject);
});

//API-2

app.get("/states/:stateId/", async (request, response) => {
  let { stateId } = request.params;
  let StateWithId = `SELECT * FROM state
  WHERE 
    state_id = ${stateId}`;
  let dbResponse = await db.all(StateWithId);
  //console.log(dbResponse);
  let responseObject = dbResponse.map((eachItem) =>
    convertDbObjectToResponseObject(eachItem)
  );
  //console.log(responseObject);
  response.send(responseObject[0]);
});

//API-3

app.post("/districts/", async (request, response) => {
  let { districtName, stateId, cases, cured, active, deaths } = request.body;
  const districtStatusQuery = `INSERT INTO district(district_name,state_id,cases,cured,active,deaths)
        VALUES("${districtName}",
            ${stateId},
            ${cases},
            ${cured},
            ${active},
            ${deaths}
            );`;
  let dbResponse = await db.run(districtStatusQuery);
  //console.log(dbResponse);
  response.send("District Successfully Added");
});

//API-4

app.get("/districts/:districtId/", async (request, response) => {
  let { districtId } = request.params;
  let specificDistrictQuery = `SELECT * FROM district
    WHERE 
        district_id = ${districtId}`;
  let dbResponse = await db.all(specificDistrictQuery);
  let responseObject = dbResponse.map((eachItem) =>
    convertDbDictObjectToResponseDictObject(eachItem)
  );
  //console.log(responseObject);
  response.send(responseObject[0]);
});

//API-5

app.delete("/districts/:districtId/", async (request, response) => {
  let { districtId } = request.params;
  let deleteDistrictQuery = `DELETE FROM district
    WHERE 
        district_id = ${districtId}`;
  let dbResponse = await db.run(deleteDistrictQuery);
  //console.log(dbResponse);
  response.send("District Removed");
});

//API-6

app.put("/districts/:districtId/", async (request, response) => {
  let { districtId } = request.params;
  let { districtName, stateId, cases, cured, active, deaths } = request.body;
  const updateDistrictDetailsQuery = `UPDATE district
        SET 
            district_name = "${districtName}",
            state_id = ${stateId},
            cases = ${cases},
            cured = ${cured},
            active = ${active},
            deaths = ${deaths}
            
        WHERE 
            district_id = ${districtId};`;
  let dbResponse = await db.run(updateDistrictDetailsQuery);
  //console.log(dbResponse);
  response.send("District Details Updated");
});

//API-7

app.get("/states/:stateId/stats/", async (request, response) => {
  let { stateId } = request.params;
  let totalDictsOfState = `SELECT district_name,SUM(cases)AS total_cases,SUM(cured)AS total_cured,SUM(active)As total_active,SUM(deaths)As total_deaths
    FROM district
    WHERE state_id = ${stateId}
    GROUP BY state_id;`;
  let dbResponse = await db.get(totalDictsOfState);
  //console.log(conTotalDictsOfStateToResObject(dbResponse));
  response.send(conTotalDictsOfStateToResObject(dbResponse));
});

//API-8

app.get("/districts/:districtId/details/", async (request, response) => {
  let { districtId } = request.params;
  let findStateName = `SELECT state_name
    FROM state NATURAL JOIN district
    WHERE district_id= ${districtId};`;
  let dbResponse = await db.get(findStateName);
  //console.log(convertStateNameToResponseObject(dbResponse));
  response.send(convertStateNameToResponseObject(dbResponse));
});

module.exports = app;
