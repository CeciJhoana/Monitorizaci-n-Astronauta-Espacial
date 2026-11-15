--
-- PostgreSQL database dump
--

\restrict NnPSvvsYcQKdNe0PvGdtCWWfKT0K0171tEU88Nc44yM2xQtIAJiKdlJjaPWON1W

-- Dumped from database version 16.15 (Ubuntu 16.15-0ubuntu0.24.04.1)
-- Dumped by pg_dump version 16.15 (Ubuntu 16.15-0ubuntu0.24.04.1)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: clima; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.clima (
    id integer NOT NULL,
    fecha timestamp with time zone DEFAULT now() NOT NULL,
    detector text NOT NULL,
    temperatura real,
    humedad real,
    uv real,
    pulso real,
    spo2 real,
    temp_corp real,
    sim boolean DEFAULT false,
    salud real
);


--
-- Name: clima_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.clima_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: clima_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.clima_id_seq OWNED BY public.clima.id;


--
-- Name: lecturas; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.lecturas (
    id integer NOT NULL,
    fecha timestamp with time zone DEFAULT now() NOT NULL,
    detector text NOT NULL,
    mac text,
    nombre text,
    rssi integer
);


--
-- Name: lecturas_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.lecturas_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: lecturas_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.lecturas_id_seq OWNED BY public.lecturas.id;


--
-- Name: clima id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.clima ALTER COLUMN id SET DEFAULT nextval('public.clima_id_seq'::regclass);


--
-- Name: lecturas id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.lecturas ALTER COLUMN id SET DEFAULT nextval('public.lecturas_id_seq'::regclass);


--
-- Name: clima clima_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.clima
    ADD CONSTRAINT clima_pkey PRIMARY KEY (id);


--
-- Name: lecturas lecturas_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.lecturas
    ADD CONSTRAINT lecturas_pkey PRIMARY KEY (id);


--
-- Name: idx_clima_fecha; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_clima_fecha ON public.clima USING btree (fecha DESC);


--
-- Name: idx_lecturas_fecha; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_lecturas_fecha ON public.lecturas USING btree (fecha DESC);


--
-- PostgreSQL database dump complete
--

\unrestrict NnPSvvsYcQKdNe0PvGdtCWWfKT0K0171tEU88Nc44yM2xQtIAJiKdlJjaPWON1W

