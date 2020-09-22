var ENDPOINT = "https://rickandmortyapi.com/api/";

var controller = {
    next: null,
    episodes: {},
    characters: {},
    locations: {},
}

$(function () {
    /* FETCH THE FIRST EPISODES PAGE */
    axios.get(ENDPOINT).then(function (result) {
        var routes = result.data;
        controller.next = routes.episodes;
        loadNextPage().then(function () {
            showEpisode(1);
        });
    });
    /* EVENT LISTENERS */
    $("#load-more").click(loadNextPage);

    $(".episodes").on("click", "li", function (e) {
        var id = $(e.target).attr("data-episode");
        var mainId = $('[role="main"]').attr("id");
        if ("episode-" + id != mainId)
            show(id, "episode")
    });

    $('[role="main"]').on("click", ".character-card", function (e) {
        var id = $(e.currentTarget).attr("data-character");
        show(id, "character")
    });

    $('[role="main"]').on("click", ".episode-card", function (e) {
        var id = $(e.currentTarget).attr("data-episode");
        show(id, "episode")
    });

    $('[role="main"]').on("click", ".morty-btn", function (e) {
        var characterId = $(e.target).closest('[role="main"]').attr("id").split("-")[1];
        var character = controller.characters[characterId];
        if (character.origin.name == "unknown") return;
        show(characterId, "location")
    });

    /* MOBILE EVENT LISTENERS */
    $(".aside-btn").click(toggleAside);
});

/* LOAD FUNCTIONS */

function loadNextPage() {
    if (controller.next == null) return;
    return getData(controller.next).then(function (page) {
        controller.next = page.info.next;
        page.results.forEach(function (episode) {
            controller.episodes[episode.id] = episode;
            $(".episodes").append($('<li data-episode="' + episode.id + '">Episode ' + episode.id + '</li>'))
        });
    });
}

function populateData(urls, type) {
    var storage = controller[type];
    getAllData(urls, storage).then(function (data) {
        data.forEach(function (elem) {
            storage[elem.id] = elem;
            $(".cards-list").append(createCard(elem, type));
        });
    });
}

/* SHOW TYPE FUNCTIONS */

function show(id, type) {
    $('[role="main"]').empty();
    $('[role="main"]').attr("id", type + "-" + id);
    if (type == "episode")
        showEpisode(id);
    else if (type == "character")
        showCharacter(id);
    else if (type == "location")
        showLocation(id);
}

function showEpisode(id) {
    var episode = controller.episodes[id];
    $('[role="main"]').append(createTemplate(episode, "episode"));
    populateData(episode.characters, "characters");
}

function showCharacter(id) {
    var character = controller.characters[id];
    $('[role="main"]').append(createTemplate(character, "character"));
    populateData(character.episode, "episodes");
}

function showLocation(characterId) {
    var character = controller.characters[characterId];
    var originId = getIdFromURL(character.origin.url);
    if (originId in controller.locations) {
        var origin = controller.locations[originId];
        $('[role="main"]').append(createTemplate(origin, "location"));
        populateData(origin.residents, "characters")
    } else {
        getData(character.origin.url).then(function (location) {
            controller.locations[location.id] = location;
            $('[role="main"]').append(createTemplate(location, "location"));
            populateData(location.residents, "characters")
        });
    }
}

/** TEMPLATES  */

function createTemplate(elem, type) {
    if (type == "character")
        return createCharacterTemplate(elem);
    else if (type == "episode")
        return createEpisodeTemplate(elem);
    else if (type == "location")
        return createLocationTemplate(elem);
    return $("");
}

function createLocationTemplate(location) {
    return $("<h1>" + location.name + "</h1>" +
        "<p class=\"subtitle\"> " + location.type + " <strong>" + location.dimension + "</strong></p>" +
        "<div class=\"cards-list\"></div>");
}

function createCharacterTemplate(character) {
    return $("<div class=\"character-header\"><img src=\"" + character.image +
        "\"/><div class=\"character-info\"><h1>" + character.name +
        "</h1><p>" + character.species +
        " <strong>|</strong> " + character.status +
        "<strong>|</strong> " + character.gender +
        " <strong>|</strong> " + character.origin.name +
        "</p><button class=\"morty-btn\">Location</button></div> </div><div class=\"cards-list\"></div>");
}

function createEpisodeTemplate(episode) {
    return $("<h1>" + episode.name + "</h1>" +
        "<p class=\"subtitle\"> " + episode.air_date + " <strong>" + episode.episode + "</strong></p>" +
        "<div class=\"cards-list\"></div>");
}

/** CARDS */

function createCard(elem, type) {
    if (type == "characters")
        return createCharacterCard(elem);
    else if (type == "episodes")
        return createEpisodeCard(elem);
    return $("");
}

function createCharacterCard(character) {
    return $("<div class=\"character-card\" data-character=\"" + character.id + "\"><img src=\"" + character.image +
        "\"/><h3>" + character.name + "</h3><p>" +
        character.species + " <strong>| " +
        character.status + "</strong></p> </div>");
}

function createEpisodeCard(episode) {
    return $("<div class=\"episode-card\" data-episode=\"" + episode.id +
                "\"><h2><strong>" + episode.name +
                "</strong></h2><p>" + episode.episode + "</p></div>");
}

/* AJAX FUNCTIONS */

function getData(url) {
    return axios.get(url).then(function (result) {
        return result.data;
    });
}

function getAll(arr) {
    return axios.all(
        arr.map(function (url) {
            return getData(url);
        })
    );
}

function getAllData(urls, storage) {
    var visiteds = [],
        nVisiteds = [];
    for (var i = 0; i < urls.length; i++) {
        var id = getIdFromURL(urls[i]);
        if (id in storage)
            visiteds.push(storage[id]);
        else
            nVisiteds.push(urls[i]);
    }
    return getAll(nVisiteds).then(function (data) {
        return visiteds.concat(data);
    });
}

/** UTIL FUNCTIONS */

function toggleAside() {
    var display = $("aside").css("display");
    var opacity = $("aside").css("opacity");
    var newDisplay = display == "flex" ? "none" : "flex";
    var newOpacity = opacity == "1" ? "0" : "1";
    if (newOpacity == "1")
        $("aside").css("display", "flex");

    $("aside").animate({
        opacity: newOpacity
    }, 200, function () {
        $("aside").css("display", newDisplay);
    });
}

function getIdFromURL(url) {
    var splited = url.split('/');
    var id = splited[splited.length - 1];
    return id;
}